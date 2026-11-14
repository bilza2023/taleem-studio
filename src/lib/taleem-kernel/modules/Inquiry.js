// src/lib/taleem-kernel/modules/Inquiry.js

const parse = (s) => { try { return JSON.parse(s ?? "[]"); } catch { return []; } };
const shape = (r) => (r ? { ...r, tags: parse(r.tags) } : null);

export default class Inquiry {
	constructor(kernel) { this.kernel = kernel; }

	// ── student side ─────────────────────────────────────────
	async create({ userId, message, courseSlug = null }) {
		const text = message?.trim();
		if (!userId || !text) throw new Error("Inquiry.create(): userId and message required");
		return shape(await this.kernel.db.inquiry.create({
			data: { userId, message: text, courseSlug }
		}));
	}

	async listForUser(userId, { limit = 20 } = {}) {
		const rows = await this.kernel.db.inquiry.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" },
			take: limit,
			select: {
				id: true, message: true, courseSlug: true, status: true,
				reply: true, repliedAt: true, replyReadAt: true, createdAt: true
			}
		});
		return rows; // no tags / repliedBy for students
	}

	// how many sent since a date — backend uses this for the weekly limit
	async countSince(userId, since) {
		return this.kernel.db.inquiry.count({ where: { userId, createdAt: { gte: since } } });
	}

	// replies the student hasn't opened yet — "1 reply" badge
	async unreadReplies(userId) {
		return this.kernel.db.inquiry.count({
			where: { userId, status: "ANSWERED", replyReadAt: null }
		});
	}

	// student opened their replies — only touches their own rows
	async markRepliesRead(userId) {
		return this.kernel.db.inquiry.updateMany({
			where: { userId, status: "ANSWERED", replyReadAt: null },
			data: { replyReadAt: new Date() }
		});
	}

	// ── team side ────────────────────────────────────────────
	async get(id) {
		return shape(await this.kernel.db.inquiry.findUnique({
			where: { id },
			include: { user: { select: { id: true, email: true, name: true } } }
		}));
	}

	async listPage({ status, courseSlug, tag } = {}, { page = 1, pageSize = 20 } = {}) {
		const where = {};
		if (status) where.status = status;
		if (courseSlug) where.courseSlug = courseSlug;
		if (tag) where.tags = { contains: JSON.stringify(tag) };

		const size = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
		const p = Math.max(Number(page) || 1, 1);

		const [items, total] = await Promise.all([
			this.kernel.db.inquiry.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (p - 1) * size,
				take: size,
				include: { user: { select: { id: true, email: true, name: true } } }
			}),
			this.kernel.db.inquiry.count({ where })
		]);

		return { items: items.map(shape), total, page: p, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
	}

	async reply(id, { reply, repliedBy }) {
		const text = reply?.trim();
		if (!text) throw new Error("Inquiry.reply(): reply required");
		return shape(await this.kernel.db.inquiry.update({
			where: { id },
			data: { reply: text, repliedBy, repliedAt: new Date(), replyReadAt: null, status: "ANSWERED" }
		}));
	}

	async setStatus(id, status) {
		return shape(await this.kernel.db.inquiry.update({ where: { id }, data: { status } }));
	}

	async setTags(id, tags = []) {
		return shape(await this.kernel.db.inquiry.update({
			where: { id },
			data: { tags: JSON.stringify(Array.isArray(tags) ? tags : []) }
		}));
	}

	async setPublic(id, isPublic) {
		return shape(await this.kernel.db.inquiry.update({ where: { id }, data: { isPublic: !!isPublic } }));
	}

	async delete(id) {
		return this.kernel.db.inquiry.delete({ where: { id } });
	}
}