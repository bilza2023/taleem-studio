// src/lib/server/modules/group.js
// Structure: groups (chapters) inside a course. Read public, write super (api.js).

import { db } from "../db.js";
import { fail } from "../access.js";

const ORDER = [{ sortOrder: "asc" }, { id: "asc" }];
const key = (courseSlug, slug) => ({ courseSlug_slug: { courseSlug, slug } });

function str(v) {
	return typeof v === "string" ? v.trim() : "";
}

function fields(src) {
	const data = {};
	if (src.title !== undefined) {
		if (!str(src.title)) fail(400, "title cannot be empty.");
		data.title = str(src.title);
	}
	if (src.description !== undefined) data.description = src.description;
	if (src.thumbnail !== undefined) data.thumbnail = src.thumbnail;
	return data;
}

async function mustExist(courseSlug, groupSlug) {
	const group = await db.group.findUnique({ where: key(courseSlug, groupSlug) });
	if (!group) fail(404, `Group "${groupSlug}" not found in course "${courseSlug}".`);
	return group;
}

// public — { courseSlug } → groups in sortOrder
export async function list(input) {
	const courseSlug = str(input.courseSlug);
	if (!courseSlug) fail(400, "courseSlug is required.");
	return db.group.findMany({ where: { courseSlug }, orderBy: ORDER });
}

// public — { courseSlug, groupSlug } → group
export async function get(input) {
	return mustExist(str(input.courseSlug), str(input.groupSlug));
}

// super — { courseSlug, slug, title, description?, thumbnail? } → group (appended at the end)
export async function create(input) {
	const courseSlug = str(input.courseSlug);
	const slug = str(input.slug);
	if (!courseSlug) fail(400, "courseSlug is required.");
	if (!slug) fail(400, "slug is required.");
	if (!str(input.title)) fail(400, "title is required.");
	if (!(await db.course.findUnique({ where: { slug: courseSlug } }))) fail(404, `Course "${courseSlug}" not found.`);

	const last = await db.group.findFirst({
		where: { courseSlug },
		orderBy: { sortOrder: "desc" },
		select: { sortOrder: true }
	});

	try {
		return await db.group.create({
			data: { courseSlug, slug, ...fields(input), sortOrder: (last?.sortOrder ?? -1) + 1 }
		});
	} catch (err) {
		if (err.code === "P2002") fail(409, `Group "${slug}" already exists in "${courseSlug}".`);
		throw err;
	}
}

// super — { courseSlug, groupSlug, changes: { title?, description?, thumbnail? } } → group
// slug is not editable: library items point at it.
export async function update(input) {
	const courseSlug = str(input.courseSlug);
	const groupSlug = str(input.groupSlug);
	await mustExist(courseSlug, groupSlug);

	const data = fields(input.changes ?? {});
	if (!Object.keys(data).length) fail(400, "Nothing to update.");
	return db.group.update({ where: key(courseSlug, groupSlug), data });
}

// super — { courseSlug, groupSlug } → ok (blocked while it still has items)
export async function remove(input) {
	const courseSlug = str(input.courseSlug);
	const groupSlug = str(input.groupSlug);
	await mustExist(courseSlug, groupSlug);

	try {
		await db.group.delete({ where: key(courseSlug, groupSlug) });
	} catch (err) {
		if (err.code === "P2003" || err.code === "P2014") {
			fail(409, "Group still has items — move or delete them first.");
		}
		throw err;
	}
	return { ok: true };
}

// super — { courseSlug, slugs: [every group slug, new order] } → groups
export async function reorder(input) {
	const courseSlug = str(input.courseSlug);
	if (!courseSlug) fail(400, "courseSlug is required.");

	const slugs = input.slugs;
	const existing = await db.group.findMany({ where: { courseSlug }, select: { slug: true } });
	const known = new Set(existing.map((g) => g.slug));

	const valid =
		Array.isArray(slugs) &&
		slugs.length === known.size &&
		new Set(slugs).size === slugs.length &&
		slugs.every((s) => known.has(s));

	if (!valid) fail(400, "Reorder list must contain every group in the course exactly once.");

	await db.$transaction(
		slugs.map((slug, i) => db.group.update({ where: key(courseSlug, slug), data: { sortOrder: i } }))
	);

	return db.group.findMany({ where: { courseSlug }, orderBy: ORDER });
}