///home/bilal-tariq/00--TALEEM/taleem-kernel/src/modules/Library.js
const PUBLIC_STATUS = "PUBLISHED";
const STUDENT_VISIBLE = ["PUBLISHED", "DRAFT"]; // drafts shown as "coming soon"
const CARD_SELECT = {
	slug: true,
	title: true,
	thumbnail: true,
	type: true,
	status: true,
	courseSlug: true,
	groupSlug: true,
	sortOrder: true
};


export default class Library {
	constructor(kernel) { this.kernel = kernel; }

	async list(filters = {}, { includeUnpublished = false, includeContent = false } = {}) {
		const where = {};
		if (filters.type) where.type = filters.type;
		if (filters.courseSlug) where.courseSlug = filters.courseSlug;
		if (filters.groupSlug) where.groupSlug = filters.groupSlug;

		// tags is a JSON string like ["hasErrors","pinned"].
		// Matching the quoted tag means "pinned" won't match "pinnedOld".
		if (filters.tag) where.tags = { contains: JSON.stringify(filters.tag) };

		if (!includeUnpublished) where.status = PUBLIC_STATUS;
		else if (filters.status) {
			where.status = Array.isArray(filters.status)
				? { in: filters.status }
				: filters.status;
		}

		return this.kernel.db.library.findMany({
			where,
			select: {
				slug: true,
				title: true,
				description: true,
				thumbnail: true,
				type: true,
				status: true,
				courseSlug: true,
				groupSlug: true,
				sortOrder: true,
				allowCommunication: true,
				createdAt: true,
				tags: true,
				updatedAt: true,
				...(includeContent ? { body: true, narration: true } : {})
			},
			orderBy: { sortOrder: "asc" }
		});
	}

	async listByTag(tag, opts) {
		return this.list({ tag }, opts);
	}

	async listByCourse(courseSlug, opts) {
		return this.list({ courseSlug }, opts);
	}

	async listByGroup(courseSlug, groupSlug, opts) {
		return this.list({ courseSlug, groupSlug }, opts);
	}

	async get(slug, { includeUnpublished = false } = {}) {
		return this.kernel.db.library.findUnique({
			where: {
				slug,
				...(includeUnpublished ? {} : { status: PUBLIC_STATUS })
			}
		});
	}

	async create(data) {
		return this.kernel.db.library.create({ data });
	}

	async update(slug, data) {
		return this.kernel.db.library.update({
			where: { slug },
			data
		});
	}

	async delete(slug) {
		// throws if Communication rows still reference this slug (Restrict)
		return this.kernel.db.library.delete({
			where: { slug }
		});
	}

	async createFromSlot(slug, courseSlug, groupSlug, type) {
		return this.create({
			slug,
			courseSlug,
			groupSlug,
			type,
			title: slug
		});
	}
	// what a student sees: published + draft, never archived.
	// card fields only — never body/narration
	async studentList(filters = {}) {
		return this.list(
			{ ...filters, status: STUDENT_VISIBLE },
			{ includeUnpublished: true, includeContent: false }
		);
	}

		// card data for a list of slugs (recently watched) — published only,
	// returned in the same order as the slugs passed in
	async cardsBySlugs(slugs = []) {
		if (!slugs.length) return [];
		const rows = await this.kernel.db.library.findMany({
			where: { slug: { in: slugs }, status: PUBLIC_STATUS },
			select: CARD_SELECT
		});
		const bySlug = new Map(rows.map((r) => [r.slug, r]));
		return slugs.map((s) => bySlug.get(s)).filter(Boolean);
	}

	// "Up next": the next published deck in the same group
	async nextInGroup(slug) {
		const current = await this.kernel.db.library.findUnique({
			where: { slug },
			select: { courseSlug: true, groupSlug: true }
		});
		if (!current) return null;

		const items = await this.kernel.db.library.findMany({
			where: { courseSlug: current.courseSlug, groupSlug: current.groupSlug, status: PUBLIC_STATUS },
			select: CARD_SELECT,
			orderBy: [{ sortOrder: "asc" }, { slug: "asc" }]
		});

		const i = items.findIndex((x) => x.slug === slug);
		return i >= 0 ? (items[i + 1] ?? null) : null;
	}

	// first-day "Start here": first published deck of a course,
	// in book order (group order, then deck order)
	async firstInCourse(courseSlug) {
		return this.kernel.db.library.findFirst({
			where: { courseSlug, status: PUBLIC_STATUS },
			select: CARD_SELECT,
			orderBy: [
				{ group: { sortOrder: "asc" } },
				{ sortOrder: "asc" },
				{ slug: "asc" }
			]
		});
	}
	
}