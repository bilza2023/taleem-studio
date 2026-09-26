///home/bilal-tariq/00--TALEEM/taleem-kernel/src/modules/Communication.js
export default class Communication {

	constructor(kernel) {
		this.kernel = kernel;
	}

	async list(filters = {}) {
		const where = {};

		if (filters.courseSlug) {
			where.library = { courseSlug: filters.courseSlug };
		}

		if (filters.librarySlug) where.librarySlug = filters.librarySlug;
		if (filters.userId) where.userId = filters.userId;
		if (filters.initiator) where.initiator = filters.initiator;

		if (filters.unanswered) {
			where.OR = [
				{ authorResponse: null },
				{ authorResponse: "" }
			];
		}

		return this.kernel.db.communication.findMany({
			where,
			include: { user: true, library: true },
			orderBy: { createdAt: "desc" }
		});
	}

	async get(id) {
		return this.kernel.db.communication.findUnique({
			where: { id },
			include: { user: true, library: true }
		});
	}

	async create(data) {
		// throws if librarySlug doesn't resolve to an existing Library row
		return this.kernel.db.communication.create({ data });
	}

	async update(id, data) {
		return this.kernel.db.communication.update({
			where: { id },
			data
		});
	}

	async delete(id) {
		return this.kernel.db.communication.delete({
			where: { id }
		});
	}

	async listUnanswered(courseSlug) {
		return this.list({ courseSlug, unanswered: true });
	}

	async countUserOpenQuestions(userId) {
		return this.kernel.db.communication.count({
			where: {
				userId,
				OR: [
					{ authorResponse: null },
					{ authorResponse: "" }
				]
			}
		});
	}
}