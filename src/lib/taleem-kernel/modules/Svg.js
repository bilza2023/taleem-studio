export default class Svg {
	constructor(kernel) { this.kernel = kernel; }

	async list() {
		return this.kernel.db.svg.findMany({ orderBy: { title: "asc" } });
	}

	async get(slug) {
		return this.kernel.db.svg.findUnique({ where: { slug } });
	}

	async create(data) {
		return this.kernel.db.svg.create({ data });
	}

	async update(slug, data) {
		return this.kernel.db.svg.update({ where: { slug }, data });
	}

	async delete(slug) {
		return this.kernel.db.svg.delete({ where: { slug } });
	}
}