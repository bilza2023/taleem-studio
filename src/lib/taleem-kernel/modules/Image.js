// src/serverKernel/modules/Image.js

export default class Image {
	constructor(kernel) { this.kernel = kernel; }

	async list() {
		return this.kernel.db.image.findMany({
			orderBy: { createdAt: "desc" }
		});
	}

	async get(slug) {
		return this.kernel.db.image.findUnique({ where: { slug } });
	}

	async create(data) {
		return this.kernel.db.image.create({ data });
	}

	async update(slug, data) {
		return this.kernel.db.image.update({ where: { slug }, data });
	}

	async delete(slug) {
		return this.kernel.db.image.delete({ where: { slug } });
	}
}