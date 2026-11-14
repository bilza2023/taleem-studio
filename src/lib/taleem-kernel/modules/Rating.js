
// src/lib/taleem-kernel/modules/Rating.js

const parse = (s) => { try { return JSON.parse(s ?? "[]"); } catch { return []; } };
const shape = (r) => (r ? { ...r, options: parse(r.options) } : null);


export default class Rating {
	constructor(kernel) { this.kernel = kernel; }

	// one rating per student per deck — re-rating updates the row
	async save({ userId, librarySlug, courseSlug, stars, options = [], comment = null }) {
		const n = Number(stars);
		if (!Number.isInteger(n) || n < 1 || n > 5) throw new Error("Rating.save(): stars must be 1–5");
		if (!userId || !librarySlug || !courseSlug) throw new Error("Rating.save(): userId, librarySlug, courseSlug required");

		const data = {
			stars: n,
			options: JSON.stringify(Array.isArray(options) ? options : []),
			comment: comment?.trim() || null
		};

		const row = await this.kernel.db.rating.upsert({
			where: { userId_librarySlug: { userId, librarySlug } },
			create: { userId, librarySlug, courseSlug, ...data },
			update: data
		});
		return shape(row);
	}

	async getMine(userId, librarySlug) {
		return shape(await this.kernel.db.rating.findUnique({
			where: { userId_librarySlug: { userId, librarySlug } }
		}));
	}

	// { slug: stars } for a list of decks — hub "★ 4" markers
	async starsForSlugs(userId, slugs = []) {
		if (!slugs.length) return {};
		const rows = await this.kernel.db.rating.findMany({
			where: { userId, librarySlug: { in: slugs } },
			select: { librarySlug: true, stars: true }
		});
		return Object.fromEntries(rows.map((r) => [r.librarySlug, r.stars]));
	}

	// one deck: average, count, star spread, option counts
	async summary(librarySlug) {
		const rows = await this.kernel.db.rating.findMany({
			where: { librarySlug },
			select: { stars: true, options: true }
		});
		const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		const options = {};
		let total = 0;
		for (const r of rows) {
			stars[r.stars] += 1;
			total += r.stars;
			for (const o of parse(r.options)) options[o] = (options[o] ?? 0) + 1;
		}
		return {
			librarySlug,
			count: rows.length,
			average: rows.length ? Math.round((total / rows.length) * 10) / 10 : null,
			stars,
			options
		};
	}

	// per-deck average + count for a whole course (admin overview)
	async summaryByCourse(courseSlug) {
		const rows = await this.kernel.db.rating.groupBy({
			by: ["librarySlug"],
			where: { courseSlug },
			_avg: { stars: true },
			_count: { _all: true }
		});
		return rows.map((r) => ({
			librarySlug: r.librarySlug,
			average: Math.round((r._avg.stars ?? 0) * 10) / 10,
			count: r._count._all
		}));
	}

	// ratings to read, newest first (admin)
	async listPage({ courseSlug, librarySlug, withComment = false } = {}, { page = 1, pageSize = 20 } = {}) {
		const where = {};
		if (courseSlug) where.courseSlug = courseSlug;
		if (librarySlug) where.librarySlug = librarySlug;
		if (withComment) where.comment = { not: null };

		const size = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
		const p = Math.max(Number(page) || 1, 1);

		const [items, total] = await Promise.all([
			this.kernel.db.rating.findMany({
				where,
				orderBy: { updatedAt: "desc" },
				skip: (p - 1) * size,
				take: size,
				include: { user: { select: { id: true, email: true, name: true } } }
			}),
			this.kernel.db.rating.count({ where })
		]);

		return { items: items.map(shape), total, page: p, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
	}
}