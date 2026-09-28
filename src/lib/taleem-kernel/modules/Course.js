export default class Course {
	constructor(kernel) { this.kernel = kernel; }

	async list(filters = {}) {
		const where = {};
		if (filters.access) where.access = filters.access;
		if (filters.isActive !== undefined) where.isActive = filters.isActive;
		return this.kernel.db.course.findMany({
			where,
			orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
		});
	}

	async get(slug) {
		return this.kernel.db.course.findUnique({ where: { slug } });
	}

	async create(data) {
		return this.kernel.db.course.create({ data });
	}

	async update(slug, data) {
		return this.kernel.db.course.update({ where: { slug }, data });
	}

	async delete(slug) {
		// throws if any Group or Subscription still references this course
		return this.kernel.db.course.delete({ where: { slug } });
	}

	async authorize(userId, courseSlug) {
	const course = await this.get(courseSlug);
	if (!course) throw new Error(`Course "${courseSlug}" not found.`);

	if (course.access === "OPEN") return true;

	if (course.access === "MEMBERS") {
		if (!userId) throw new Error("Login required for this course.");
		return true;
	}

	if (course.access === "SUBSCRIPTION") {
		if (!userId) throw new Error("Login required for this course.");
		await this.kernel.subscription.authorize(userId, courseSlug);
		return true;
	}

	throw new Error(`Unknown access level "${course.access}".`);
	}
}