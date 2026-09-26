// src/serverKernel/modules/Audio.js

export default class Audio {
	constructor(kernel) { this.kernel = kernel; }

	async list() {
		return this.kernel.db.audio.findMany({
			orderBy: { createdAt: "desc" }
		});
	}

	async get(slug) {
		return this.kernel.db.audio.findUnique({ where: { slug } });
	}

	async create(data) {
		return this.kernel.db.audio.create({ data });
	}

	async update(slug, data) {
		return this.kernel.db.audio.update({ where: { slug }, data });
	}

	async delete(slug) {
		return this.kernel.db.audio.delete({ where: { slug } });
	}
}