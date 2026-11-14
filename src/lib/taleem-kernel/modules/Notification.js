// src/lib/taleem-kernel/modules/Notification.js

const AUDIENCES = ["APP", "COURSE", "USER"];

// live = published and not expired
function liveWhere(now = new Date()) {
	return {
		publishAt: { lte: now },
		OR: [{ expiresAt: null }, { expiresAt: { gt: now } }]
	};
}

export default class Notification {
	constructor(kernel) { this.kernel = kernel; }

	async create({ audience, courseSlug = null, userId = null, title, body = null, link = null, createdBy = null, publishAt, expiresAt = null }) {
		if (!AUDIENCES.includes(audience)) throw new Error(`Notification.create(): audience must be ${AUDIENCES.join("/")}`);
		if (!title?.trim()) throw new Error("Notification.create(): title required");
		if (audience === "COURSE" && !courseSlug) throw new Error("Notification.create(): COURSE needs courseSlug");
		if (audience === "USER" && !userId) throw new Error("Notification.create(): USER needs userId");

		return this.kernel.db.notification.create({
			data: {
				audience,
				courseSlug: audience === "COURSE" ? courseSlug : null,
				userId: audience === "USER" ? userId : null,
				title: title.trim(),
				body: body?.trim() || null,
				link,
				createdBy,
				...(publishAt ? { publishAt: new Date(publishAt) } : {}),
				expiresAt: expiresAt ? new Date(expiresAt) : null
			}
		});
	}

	// everything addressed to this student: app-wide + their courses + them personally
	async forStudent(userId, courseSlugs = [], { since = null, limit = 20 } = {}) {
		const now = new Date();
		return this.kernel.db.notification.findMany({
			where: {
				AND: [
					liveWhere(now),
					{
						OR: [
							{ audience: "APP" },
							{ audience: "COURSE", courseSlug: { in: courseSlugs } },
							{ audience: "USER", userId }
						]
					},
					...(since ? [{ publishAt: { gt: since } }] : [])
				]
			},
			orderBy: { publishAt: "desc" },
			take: limit
		});
	}

	// ── team side ────────────────────────────────────────────
	async listPage({ audience, courseSlug } = {}, { page = 1, pageSize = 20 } = {}) {
		const where = {};
		if (audience) where.audience = audience;
		if (courseSlug) where.courseSlug = courseSlug;

		const size = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
		const p = Math.max(Number(page) || 1, 1);

		const [items, total] = await Promise.all([
			this.kernel.db.notification.findMany({ where, orderBy: { publishAt: "desc" }, skip: (p - 1) * size, take: size }),
			this.kernel.db.notification.count({ where })
		]);

		return { items, total, page: p, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
	}

	async update(id, data) {
		return this.kernel.db.notification.update({ where: { id }, data });
	}

	async delete(id) {
		return this.kernel.db.notification.delete({ where: { id } });
	}
}