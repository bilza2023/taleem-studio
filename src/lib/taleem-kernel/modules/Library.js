///home/bilal-tariq/00--TALEEM/taleem-kernel/src/modules/Library.js
const PUBLIC_STATUS = "PUBLISHED";

export default class Library {
	constructor(kernel) { this.kernel = kernel; }

	async list(filters = {}, { includeUnpublished = false } = {}) {
		const where = {};
		if (filters.type) where.type = filters.type;
		if (filters.courseSlug) where.courseSlug = filters.courseSlug;
		if (filters.groupSlug) where.groupSlug = filters.groupSlug;

		if (!includeUnpublished) where.status = PUBLIC_STATUS;
		else if (filters.status) where.status = filters.status;

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
				updatedAt: true
			},
			orderBy: { sortOrder: "asc" }
		});
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
	
}