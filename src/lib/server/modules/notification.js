// src/lib/server/modules/notification.js
// Announcements. Decided: super only for now (all three methods are "super" in api.js).

import { db } from "../db.js";
import { fail } from "../access.js";

const AUDIENCES = ["APP", "COURSE", "USER"];
const str = (v) => (typeof v === "string" ? v.trim() : "");

// live = published and not expired
function liveWhere(now = new Date()) {
	return { publishAt: { lte: now }, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
}

// ── data (used by hub) ────────────────────────────────────

// everything addressed to this student: app-wide + their courses + them personally
export async function forStudent(userId, courseSlugs = [], { limit = 20 } = {}) {
	return db.notification.findMany({
		where: {
			AND: [
				liveWhere(),
				{ OR: [{ audience: "APP" }, { audience: "COURSE", courseSlug: { in: courseSlugs } }, { audience: "USER", userId }] }
			]
		},
		orderBy: { publishAt: "desc" },
		take: limit
	});
}

// ── api ───────────────────────────────────────────────────

// super — { audience?, courseSlug?, page?, pageSize? } → page of notifications
export async function list(input) {
	if (input.audience && !AUDIENCES.includes(input.audience)) fail(400, "Invalid audience.");

	const where = {};
	if (input.audience) where.audience = input.audience;
	if (str(input.courseSlug)) where.courseSlug = str(input.courseSlug);

	const size = Math.min(Math.max(Number(input.pageSize) || 20, 1), 100);
	const page = Math.max(Number(input.page) || 1, 1);

	const [items, total] = await Promise.all([
		db.notification.findMany({ where, orderBy: { publishAt: "desc" }, skip: (page - 1) * size, take: size }),
		db.notification.count({ where })
	]);

	return { items, total, page, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
}

// super — { audience, courseSlug?, userId?, title, body?, link?, publishAt?, expiresAt? } → notification
export async function create(input, ctx) {
	const audience = input.audience;
	if (!AUDIENCES.includes(audience)) fail(400, `audience must be ${AUDIENCES.join("/")}.`);
	if (!str(input.title)) fail(400, "title is required.");

	const courseSlug = str(input.courseSlug) || null;
	const userId = input.userId ? Number(input.userId) : null;

	if (audience === "COURSE") {
		if (!courseSlug) fail(400, "COURSE notifications need a courseSlug.");
		if (!(await db.course.findUnique({ where: { slug: courseSlug } }))) fail(404, `Course "${courseSlug}" not found.`);
	}
	if (audience === "USER") {
		if (!userId) fail(400, "USER notifications need a userId.");
		if (!(await db.user.findUnique({ where: { id: userId } }))) fail(404, "Student not found.");
	}

	return db.notification.create({
		data: {
			audience,
			courseSlug: audience === "COURSE" ? courseSlug : null,
			userId: audience === "USER" ? userId : null,
			title: str(input.title),
			body: str(input.body) || null,
			link: input.link ?? null,
			createdBy: ctx.admin.email,
			...(input.publishAt ? { publishAt: new Date(input.publishAt) } : {}),
			expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
		}
	});
}

// super — { id } → ok
export async function remove(input) {
	const id = Number(input.id);
	if (!Number.isInteger(id) || id < 1) fail(400, "id is required.");
	const row = await db.notification.findUnique({ where: { id } });
	if (!row) fail(404, "Notification not found.");
	await db.notification.delete({ where: { id } });
	return { ok: true };
}