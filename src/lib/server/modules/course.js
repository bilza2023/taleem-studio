// src/lib/server/modules/course.js
// Structure: courses. Reading is public; writing is super only (api.js).

import { db } from "../db.js";
import { fail } from "../access.js";

const ACCESS = ["OPEN", "MEMBERS", "SUBSCRIPTION"];
const ORDER = [{ sortOrder: "asc" }, { slug: "asc" }];

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

// pick + validate the editable fields (shared by create and update)
function fields(src) {
	const data = {};
	if (src.title !== undefined) {
		if (!str(src.title)) fail(400, "title cannot be empty.");
		data.title = str(src.title);
	}
	if (src.description !== undefined) data.description = src.description;
	if (src.thumbnail !== undefined) data.thumbnail = src.thumbnail;
	if (src.access !== undefined) {
		if (!ACCESS.includes(src.access)) fail(400, `access must be ${ACCESS.join("/")}.`);
		data.access = src.access;
	}
	if (src.price !== undefined) {
		const n = Number(src.price);
		if (!Number.isInteger(n) || n < 0) fail(400, "price must be a whole number ≥ 0.");
		data.price = n;
	}
	if (src.sortOrder !== undefined) data.sortOrder = Number(src.sortOrder) || 0;
	if (src.isActive !== undefined) data.isActive = !!src.isActive;
	return data;
}

async function mustExist(slug) {
	const course = await db.course.findUnique({ where: { slug } });
	if (!course) fail(404, `Course "${slug}" not found.`);
	return course;
}

// public — { access? } → courses
// students see active courses only; any admin also sees inactive ones
export async function list(input, ctx) {
	const where = {};
	if (input.access) where.access = input.access;
	if (!ctx.admin) where.isActive = true;
	return db.course.findMany({ where, orderBy: ORDER });
}

// public — { slug } → course
export async function get(input, ctx) {
	const course = await mustExist(str(input.slug));
	if (!course.isActive && !ctx.admin) fail(404, `Course "${course.slug}" not found.`);
	return course;
}

// super — { slug, title, access?, price?, ... } → course
export async function create(input) {
	const slug = str(input.slug);
	if (!slug) fail(400, "slug is required.");
	if (!str(input.title)) fail(400, "title is required.");

	try {
		return await db.course.create({ data: { slug, ...fields(input) } });
	} catch (err) {
		if (err.code === "P2002") fail(409, `Course "${slug}" already exists.`);
		throw err;
	}
}

// super — { slug, changes } → course
export async function update(input) {
	const slug = str(input.slug);
	await mustExist(slug);
	const data = fields(input.changes ?? {});
	if (!Object.keys(data).length) fail(400, "Nothing to update.");
	return db.course.update({ where: { slug }, data });
}

// super — { slug } → ok
// blocked while groups or subscriptions exist; on success, removed from every admin's course list
export async function remove(input) {
	const slug = str(input.slug);
	await mustExist(slug);

	try {
		await db.course.delete({ where: { slug } });
	} catch (err) {
		if (err.code === "P2003" || err.code === "P2014") {
			fail(409, "Course still has groups or subscriptions — remove those first.");
		}
		throw err;
	}

	const admins = await db.admin.findMany({ select: { email: true, courseSlugs: true } });
	for (const a of admins) {
		const list = parseList(a.courseSlugs);
		if (list.includes(slug)) {
			await db.admin.update({
				where: { email: a.email },
				data: { courseSlugs: JSON.stringify(list.filter((s) => s !== slug)) }
			});
		}
	}

	return { ok: true };
}