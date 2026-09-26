export default class Subscription {
	constructor(kernel) { this.kernel = kernel; }

	async list(filters = {}) {
		const where = {};
		if (filters.userId) where.userId = filters.userId;
		if (filters.courseSlug) where.courseSlug = filters.courseSlug;
		return this.kernel.db.subscription.findMany({ where });
	}

	async get(id) {
		return this.kernel.db.subscription.findUnique({ where: { id } });
	}

	async create(data) {
		// throws if courseSlug doesn't resolve to an existing Course
		return this.kernel.db.subscription.create({ data });
	}

	async update(id, data) {
		return this.kernel.db.subscription.update({ where: { id }, data });
	}

	async delete(id) {
		return this.kernel.db.subscription.delete({ where: { id } });
	}

	async authorize(userId, courseSlug) {
		const now = new Date();

		const subscription = await this.kernel.db.subscription.findFirst({
			where: {
				userId,
				courseSlug,
				startsAt: { lte: now },
				endsAt: { gte: now }
			}
		});

		if (!subscription) {
			throw new Error(
				`User "${userId}" does not have an active subscription for course "${courseSlug}".`
			);
		}

		return subscription;
	}
}