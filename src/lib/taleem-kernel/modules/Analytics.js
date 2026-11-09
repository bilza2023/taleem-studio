// src/lib/taleem-kernel/modules/Analytics.js

// Shared by list() and listPage() — one place that turns filters into a Prisma where.
function buildWhere(filters = {}) {
	const where = {};
	if (filters.name) where.name = filters.name;
	if (filters.userId !== undefined) where.userId = filters.userId;
	if (filters.role) where.role = filters.role;
	if (filters.slug) where.slug = filters.slug;
	if (filters.courseSlug) where.courseSlug = filters.courseSlug;
	if (filters.since) where.createdAt = { gte: filters.since };
	return where;
}

export default class Analytics {
	constructor(kernel) { this.kernel = kernel; }

	// ── Core writer ──────────────────────────────────────────
	// The only method that touches db.analyticsEvent for writing.
	// Awaited and throws — use when the caller must know it was saved (e.g. mcq.result).
	async record(name, { userId = null, role = null, slug = null, courseSlug = null, meta = null } = {}) {
		if (!name) throw new Error("Analytics.record(): name is required");

		return this.kernel.db.analyticsEvent.create({
			data: {
				name,
				userId,
				role,
				slug,
				courseSlug,
				meta: meta ? JSON.stringify(meta) : null
			}
		});
	}

	// ── Fire-and-forget ──────────────────────────────────────
	// Wrapper over record(). Never throws. Callers don't await it; tests can.
	track(name, opts = {}) {
		if (!name) return Promise.resolve(null);
		return this.record(name, opts).catch((err) => {
			console.error(`Analytics.track(): '${name}' failed —`, err.message);
			return null;
		});
	}

	// ── Readers ──────────────────────────────────────────────
	async list(filters = {}) {
		return this.kernel.db.analyticsEvent.findMany({
			where: buildWhere(filters),
			orderBy: { createdAt: "desc" }
		});
	}

	// One page, newest first, plus totals for the pager.
	async listPage(filters = {}, { page = 1, pageSize = 20 } = {}) {
		const where = buildWhere(filters);
		const size = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
		const p = Math.max(Number(page) || 1, 1);

		const [items, total] = await Promise.all([
			this.kernel.db.analyticsEvent.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (p - 1) * size,
				take: size
			}),
			this.kernel.db.analyticsEvent.count({ where })
		]);

		return { items, total, page: p, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
	}

	// ── Reports ──────────────────────────────────────────────
	async summary({ since = null } = {}) {
		const where = { name: "lesson.open" };
		if (since) where.createdAt = { gte: since };

		// one query: counts per (course, lesson, role, user)
		const rows = await this.kernel.db.analyticsEvent.groupBy({
			by: ["courseSlug", "slug", "role", "userId"],
			where,
			_count: { _all: true }
		});

		const blank = () => ({ total: 0, student: 0, admin: 0, anonymous: 0 });
		const add = (opens, role, n) => {
			opens[role ?? "anonymous"] += n;
			opens.total += n;
		};

		const totals = { opens: blank(), students: new Set() };
		const courses = new Map();

		for (const r of rows) {
			const n = r._count._all;

			if (!courses.has(r.courseSlug)) {
				courses.set(r.courseSlug, { courseSlug: r.courseSlug, opens: blank(), students: new Set(), lessons: new Map() });
			}
			const c = courses.get(r.courseSlug);

			if (!c.lessons.has(r.slug)) {
				c.lessons.set(r.slug, { slug: r.slug, opens: blank(), students: new Set() });
			}
			const l = c.lessons.get(r.slug);

			add(totals.opens, r.role, n);
			add(c.opens, r.role, n);
			add(l.opens, r.role, n);

			if (r.role === "student" && r.userId != null) {
				totals.students.add(r.userId);
				c.students.add(r.userId);
				l.students.add(r.userId);
			}
		}

		return {
			totals: { opens: totals.opens, uniqueStudents: totals.students.size },
			courses: [...courses.values()].map((c) => ({
				courseSlug: c.courseSlug,
				opens: c.opens,
				uniqueStudents: c.students.size,
				lessons: [...c.lessons.values()]
					.map((l) => ({ slug: l.slug, opens: l.opens, uniqueStudents: l.students.size }))
					.sort((a, b) => b.opens.total - a.opens.total)
			}))
		};
	}
}