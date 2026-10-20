///home/bilal-tariq/00--TALEEM/taleem/src/lib/taleem-kernel/modules/Group.js
export default class Group {
	constructor(kernel) { this.kernel = kernel; }

async list(filters = {}) {
	const where = {};
	if (filters.courseSlug) where.courseSlug = filters.courseSlug;

	return this.kernel.db.group.findMany({
		where,
		orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
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
	const last = await this.kernel.db.group.findFirst({
		where: { courseSlug: data.courseSlug },
		orderBy: { sortOrder: "desc" },
		select: { sortOrder: true }
	});

	return this.kernel.db.group.create({
		data: { ...data, sortOrder: (last?.sortOrder ?? -1) + 1 }
	});
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


// slugs: every group slug in the course, in the new order
async reorder(courseSlug, slugs) {
	const existing = await this.kernel.db.group.findMany({
		where: { courseSlug },
		select: { slug: true }
	});
	const known = new Set(existing.map((g) => g.slug));

	const valid =
		Array.isArray(slugs) &&
		slugs.length === known.size &&
		new Set(slugs).size === slugs.length &&
		slugs.every((s) => known.has(s));

	if (!valid) {
		throw new Error("Reorder list must contain every group in the course exactly once");
	}

	await this.kernel.db.$transaction(
		slugs.map((slug, i) =>
			this.kernel.db.group.update({
				where: { courseSlug_slug: { courseSlug, slug } },
				data: { sortOrder: i }
			})
		)
	);

	return this.list({ courseSlug });
}


}