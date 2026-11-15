// src/lib/server/modules/library.js
// Content: ARTICLE / PLAYER / MCQ. One module for students and admins —
// visibility is decided from ctx, never by a separate admin route.

import { db } from "../db.js";
import { fail, canTeach } from "../access.js";
import { hasActiveSubscription } from "./subscription.js";
import { trackEvent } from "./analytics.js";

const TYPES = ["ARTICLE", "PLAYER", "MCQ"];
const EDIT_STATUSES = ["DRAFT", "PUBLISHED"]; // ARCHIVED only via archive()
const SAMPLE_TAG = "pinned";                  // pinned = free sample
const PLACEHOLDER_AUDIO = ["music.mp3", "music.opus"];

const LIST_SELECT = {
	slug: true, title: true, description: true, thumbnail: true, type: true, status: true,
	courseSlug: true, groupSlug: true, sortOrder: true, allowCommunication: true,
	createdAt: true, updatedAt: true, tags: true
};
const CARD_SELECT = {
	slug: true, title: true, thumbnail: true, type: true, status: true,
	courseSlug: true, groupSlug: true, sortOrder: true
};

function str(v) {
	return typeof v === "string" ? v.trim() : "";
}

function parseList(s) {
	try {
		const v = JSON.parse(s ?? "[]");
		return Array.isArray(v) ? v : [];
	} catch {
		return [];
	}
}

function tagList(v) {
	if (!Array.isArray(v) || !v.every((t) => typeof t === "string" && t.trim())) {
		fail(400, "tags must be an array of strings.");
	}
	return JSON.stringify([...new Set(v.map((t) => t.trim()))]);
}

function jsonText(v, field) {
	if (v === null) return null;
	if (typeof v === "string") return v;
	if (typeof v === "object") return JSON.stringify(v);
	fail(400, `${field} must be an object or JSON text.`);
}

function shape(item) {
	if (!item) return null;
	return { ...item, tags: parseList(item.tags) };
}

// admin lists: status flags instead of heavy body/narration
function withFlags(item) {
	const { body, narration, ...rest } = item;
	let hasDeck = false;
	let hasAudio = false;
	if (body?.trim()) {
		try {
			const p = JSON.parse(body);
			hasDeck = Array.isArray(p?.deck) && p.deck.length > 0;
			hasAudio = !!p?.audio && !PLACEHOLDER_AUDIO.includes(p.audio);
		} catch {}
	}
	return { ...shape(rest), hasDeck, hasAudio, hasNarration: !!narration?.trim() };
}

// ── data (used by hub) ────────────────────────────────────

// published cards for a list of slugs, in the same order as the slugs
export async function cardsBySlugs(slugs = []) {
	if (!slugs.length) return [];
	const rows = await db.library.findMany({ where: { slug: { in: slugs }, status: "PUBLISHED" }, select: CARD_SELECT });
	const bySlug = new Map(rows.map((r) => [r.slug, r]));
	return slugs.map((s) => bySlug.get(s)).filter(Boolean);
}

// "Up next": the next published item in the same group
export async function nextInGroup(slug) {
	const current = await db.library.findUnique({ where: { slug }, select: { courseSlug: true, groupSlug: true } });
	if (!current) return null;
	const items = await db.library.findMany({
		where: { courseSlug: current.courseSlug, groupSlug: current.groupSlug, status: "PUBLISHED" },
		select: CARD_SELECT,
		orderBy: [{ sortOrder: "asc" }, { slug: "asc" }]
	});
	const i = items.findIndex((x) => x.slug === slug);
	return i >= 0 ? (items[i + 1] ?? null) : null;
}

// "Start here": first published item of a course, in book order
export async function firstInCourse(courseSlug) {
	return db.library.findFirst({
		where: { courseSlug, status: "PUBLISHED" },
		select: CARD_SELECT,
		orderBy: [{ group: { sortOrder: "asc" } }, { sortOrder: "asc" }, { slug: "asc" }]
	});
}

// OPEN → anyone; MEMBERS → any logged-in student; SUBSCRIPTION → active subscription
async function canOpen(userId, courseSlug) {
	const course = await db.course.findUnique({ where: { slug: courseSlug }, select: { access: true } });
	if (!course) return false;
	if (course.access === "OPEN") return true;
	if (!userId) return false;
	if (course.access === "MEMBERS") return true;
	return hasActiveSubscription(userId, courseSlug);
}

function trackPublish(slug, courseSlug, ctx) {
	trackEvent("lesson.publish", { slug, courseSlug, role: "admin", userId: ctx.admin?.id ?? null });
}

function listWhere(filters) {
	const where = {};
	if (filters.type) where.type = filters.type;
	if (filters.courseSlug) where.courseSlug = filters.courseSlug;
	if (filters.groupSlug) where.groupSlug = filters.groupSlug;
	if (filters.tag) where.tags = { contains: JSON.stringify(filters.tag) }; // "pinned" won't match "pinnedOld"
	return where;
}

async function mustExist(slug) {
	const item = await db.library.findUnique({ where: { slug } });
	if (!item) fail(404, "Item not found.");
	return item;
}

async function groupMustExist(courseSlug, groupSlug) {
	if (!(await db.group.findUnique({ where: { courseSlug_slug: { courseSlug, slug: groupSlug } } }))) {
		fail(400, `Group "${groupSlug}" does not exist in course "${courseSlug}".`);
	}
}

// ── reading ───────────────────────────────────────────────

// public — { slug } → full item
export async function get(input, ctx) {
	const slug = str(input.slug);
	if (!slug) fail(400, "slug is required.");

	const item = await db.library.findUnique({ where: { slug } });
	if (!item) fail(404, "Item not found.");

	if (canTeach(ctx, item.courseSlug)) return shape(item);

	if (item.status !== "PUBLISHED") fail(404, "Item not found.");

	const isSample = parseList(item.tags).includes(SAMPLE_TAG);
	if (!isSample && !(await canOpen(ctx.user?.id ?? null, item.courseSlug))) {
		if (!ctx.user) fail(401, "Please log in to open this lesson.");
		fail(403, "A subscription is required for this course.");
	}

	return shape(item);
}

// public — { courseSlug?, groupSlug?, tag?, type?, status? } → cards
// teacher of courseSlug: all statuses + flags. Everyone else: published only.
export async function list(input, ctx) {
	const filters = {};
	if (input.courseSlug) filters.courseSlug = str(input.courseSlug);
	if (input.groupSlug) filters.groupSlug = str(input.groupSlug);
	if (input.tag) filters.tag = str(input.tag);
	if (input.type) {
		if (!TYPES.includes(input.type)) fail(400, `type must be ${TYPES.join("/")}.`);
		filters.type = input.type;
	}
	const where = listWhere(filters);
	const orderBy = { sortOrder: "asc" };

	if (canTeach(ctx, filters.courseSlug)) {
		if (input.status) where.status = Array.isArray(input.status) ? { in: input.status } : input.status;
		const items = await db.library.findMany({
			where,
			select: { ...LIST_SELECT, body: true, narration: true },
			orderBy
		});
		return items.map(withFlags);
	}

	where.status = "PUBLISHED";
	return (await db.library.findMany({ where, select: LIST_SELECT, orderBy })).map(shape);
}

// public — { courseSlug, groupSlug? } → published + drafts, never archived
export async function studentList(input) {
	const courseSlug = str(input.courseSlug);
	if (!courseSlug) fail(400, "courseSlug is required.");

	const where = listWhere({ courseSlug, groupSlug: str(input.groupSlug) || undefined });
	where.status = { in: ["PUBLISHED", "DRAFT"] }; // drafts shown as "coming soon"

	return (await db.library.findMany({ where, select: LIST_SELECT, orderBy: { sortOrder: "asc" } })).map(shape);
}

// ── writing ───────────────────────────────────────────────

// teacher — { slug, courseSlug, groupSlug, type, title?, status?, ...optional } → item
export async function create(input, ctx) {
	const slug = str(input.slug);
	const courseSlug = str(input.courseSlug);
	const groupSlug = str(input.groupSlug);
	const title = str(input.title) || slug;
	const type = input.type;
	const status = input.status ?? "DRAFT";

	if (!slug) fail(400, "slug is required.");
	if (!groupSlug) fail(400, "groupSlug is required.");
	if (!TYPES.includes(type)) fail(400, `type must be ${TYPES.join("/")}.`);
	if (!EDIT_STATUSES.includes(status)) fail(400, `status must be ${EDIT_STATUSES.join("/")}.`);
	await groupMustExist(courseSlug, groupSlug);

	const data = { slug, courseSlug, groupSlug, type, title, status };
	if (input.description !== undefined) data.description = input.description;
	if (input.thumbnail !== undefined) data.thumbnail = input.thumbnail;
	if (input.narration !== undefined) data.narration = input.narration;
	if (input.body !== undefined) data.body = jsonText(input.body, "body");
	if (input.meta !== undefined) data.meta = jsonText(input.meta, "meta");
	if (input.tags !== undefined) data.tags = tagList(input.tags);
	if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder) || 0;

	try {
		const created = await db.library.create({ data });
		if (created.status === "PUBLISHED") trackPublish(slug, courseSlug, ctx);
		return shape(created);
	} catch (err) {
		if (err.code === "P2002") fail(409, `Slug "${slug}" already exists.`);
		throw err;
	}
}

// teacher — { slug, changes } → item
export async function update(input, ctx) {
	const slug = str(input.slug);
	const changes = input.changes ?? {};
	const item = await mustExist(slug);

	const data = {};
	for (const key of ["title", "description", "narration", "thumbnail"]) {
		if (changes[key] !== undefined) data[key] = changes[key];
	}
	if (changes.body !== undefined) data.body = jsonText(changes.body, "body");
	if (changes.meta !== undefined) data.meta = jsonText(changes.meta, "meta");
	if (changes.tags !== undefined) data.tags = tagList(changes.tags);
	if (changes.sortOrder !== undefined) data.sortOrder = Number(changes.sortOrder) || 0;
	if (changes.allowCommunication !== undefined) data.allowCommunication = !!changes.allowCommunication;
	if (changes.status !== undefined) {
		if (!EDIT_STATUSES.includes(changes.status)) {
			fail(400, `status must be ${EDIT_STATUSES.join("/")} (use archive to archive).`);
		}
		data.status = changes.status;
	}

	if (changes.courseSlug !== undefined || changes.groupSlug !== undefined) {
		const courseSlug = str(changes.courseSlug) || item.courseSlug;
		const groupSlug = str(changes.groupSlug) || item.groupSlug;
		if (!canTeach(ctx, courseSlug)) fail(403, `Not authorized for course "${courseSlug}".`);
		await groupMustExist(courseSlug, groupSlug);
		data.courseSlug = courseSlug;
		data.groupSlug = groupSlug;
	}

	if (!Object.keys(data).length) fail(400, "Nothing to update.");

	const updated = await db.library.update({ where: { slug }, data });
	if (data.status === "PUBLISHED" && item.status !== "PUBLISHED") {
		trackPublish(slug, updated.courseSlug, ctx);
	}
	return shape(updated);
}

// teacher — { slug } → item (ARCHIVED)
export async function archive(input) {
	const slug = str(input.slug);
	await mustExist(slug);
	return shape(await db.library.update({ where: { slug }, data: { status: "ARCHIVED" } }));
}

// super — { slug } → ok (ratings cascade)
export async function remove(input) {
	const slug = str(input.slug);
	await mustExist(slug);
	await db.library.delete({ where: { slug } });
	return { ok: true };
}