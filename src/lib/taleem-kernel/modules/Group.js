export default class Group {
	constructor(kernel) { this.kernel = kernel; }

	async list(filters = {}) {
		const where = {};
		if (filters.courseSlug) where.courseSlug = filters.courseSlug;

		return this.kernel.db.group.findMany({
			where,
			orderBy: { id: "asc" }
		});
	}

	async listByCourse(courseSlug) {
		return this.list({ courseSlug });
	}

	async get(courseSlug, slug) {
		return this.kernel.db.group.findUnique({
			where: {
				courseSlug_slug: { courseSlug, slug }
			}
		});
	}

	async create(data) {
		// throws if data.courseSlug doesn't resolve to an existing Course
		return this.kernel.db.group.create({ data });
	}

	async update(courseSlug, slug, data) {
		return this.kernel.db.group.update({
			where: {
				courseSlug_slug: { courseSlug, slug }
			},
			data
		});
	}

	async delete(courseSlug, slug) {
		// throws if any Library rows still reference this group (Restrict)
		return this.kernel.db.group.delete({
			where: {
				courseSlug_slug: { courseSlug, slug }
			}
		});
	}
}