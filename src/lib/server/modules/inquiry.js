// src/lib/server/modules/inquiry.js
// Student questions. Course access for team methods is checked in api.js (from.input / from.inquiry).

import { db } from "../db.js";
import { fail } from "../access.js";

const WEEKLY_LIMIT = 2;
const MESSAGE_MAX = 1000;
const STATUSES = ["OPEN", "ANSWERED", "CLOSED"];
const USER_SELECT = { id: true, email: true, name: true };

const parse = (s) => { try { return JSON.parse(s ?? "[]"); } catch { return []; } };
const shape = (r) => (r ? { ...r, tags: parse(r.tags) } : null);

const id = (input) => {
	const n = Number(input.id);
	if (!Number.isInteger(n) || n < 1) fail(400, "id is required.");
	return n;
};

// ── data (used by hub) ────────────────────────────────────

// student's own inquiries — no tags / repliedBy
export async function listForUser(userId, { limit = 20 } = {}) {
	return db.inquiry.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
		take: limit,
		select: {
			id: true, message: true, courseSlug: true, status: true,
			reply: true, repliedAt: true, replyReadAt: true, createdAt: true
		}
	});
}

// replies not opened yet — "1 reply" badge
export async function unreadReplies(userId) {
	return db.inquiry.count({ where: { userId, status: "ANSWERED", replyReadAt: null } });
}

// ── student ──────────────────────────────────────────────

// student — { message, courseSlug? } → inquiry
export async function create(input, ctx) {
	const message = String(input.message ?? "").trim().slice(0, MESSAGE_MAX);
	if (!message) fail(400, "Write a message first.");

	const weekAgo = new Date(Date.now() - 7 * 86400000);
	const sent = await db.inquiry.count({ where: { userId: ctx.user.id, createdAt: { gte: weekAgo } } });
	if (sent >= WEEKLY_LIMIT) {
		fail(429, `You can send ${WEEKLY_LIMIT} messages a week. Please try again in a few days.`);
	}

	// optional course context — kept only if it is a real course
	let courseSlug = null;
	if (input.courseSlug) {
		const course = await db.course.findUnique({ where: { slug: String(input.courseSlug) } });
		if (course) courseSlug = course.slug;
	}

	return shape(await db.inquiry.create({ data: { userId: ctx.user.id, message, courseSlug } }));
}

// student — { limit? } → my inquiries with replies
export async function mine(input, ctx) {
	const limit = Math.min(Math.max(Number(input.limit) || 20, 1), 100);
	return listForUser(ctx.user.id, { limit });
}

// student — {} → ok
export async function markRead(input, ctx) {
	await db.inquiry.updateMany({
		where: { userId: ctx.user.id, status: "ANSWERED", replyReadAt: null },
		data: { replyReadAt: new Date() }
	});
	return { ok: true };
}

// ── team ─────────────────────────────────────────────────

// { courseSlug?, status?, tag?, page?, pageSize? } → page of inquiries
export async function list(input) {
	if (input.status && !STATUSES.includes(input.status)) fail(400, "Invalid status.");

	const where = {};
	if (input.status) where.status = input.status;
	if (input.courseSlug) where.courseSlug = String(input.courseSlug);
	if (input.tag) where.tags = { contains: JSON.stringify(input.tag) };

	const size = Math.min(Math.max(Number(input.pageSize) || 20, 1), 100);
	const page = Math.max(Number(input.page) || 1, 1);

	const [items, total] = await Promise.all([
		db.inquiry.findMany({
			where,
			orderBy: { createdAt: "desc" },
			skip: (page - 1) * size,
			take: size,
			include: { user: { select: USER_SELECT } }
		}),
		db.inquiry.count({ where })
	]);

	return { items: items.map(shape), total, page, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
}

// { id } → inquiry
export async function get(input) {
	const row = await db.inquiry.findUnique({ where: { id: id(input) }, include: { user: { select: USER_SELECT } } });
	if (!row) fail(404, "Inquiry not found.");
	return shape(row);
}

// { id, reply } → inquiry (status → ANSWERED)
export async function reply(input, ctx) {
	const text = String(input.reply ?? "").trim();
	if (!text) fail(400, "Write a reply first.");
	return shape(await db.inquiry.update({
		where: { id: id(input) },
		data: { reply: text, repliedBy: ctx.admin.email, repliedAt: new Date(), replyReadAt: null, status: "ANSWERED" }
	}));
}

// { id, status } → inquiry
export async function setStatus(input) {
	if (!STATUSES.includes(input.status)) fail(400, "Invalid status.");
	return shape(await db.inquiry.update({ where: { id: id(input) }, data: { status: input.status } }));
}

// { id, tags: [] } → inquiry
export async function setTags(input) {
	if (!Array.isArray(input.tags) || !input.tags.every((t) => typeof t === "string")) {
		fail(400, "tags must be an array of strings.");
	}
	return shape(await db.inquiry.update({ where: { id: id(input) }, data: { tags: JSON.stringify(input.tags) } }));
}