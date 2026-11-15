
// src/lib/server/modules/admin.js
// Admin identity + admin management (super only, enforced in api.js).

import { db } from "../db.js";
import { fail } from "../access.js";
import { hashPassword, checkPassword, makeAdminToken } from "../auth.js";

const ROLES = ["ADMIN", "SUPER_ADMIN"];

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

// DB row → API shape: no password, courseSlugs as a real array
function shape(admin) {
	if (!admin) return null;
	const { password, ...safe } = admin;
	return { ...safe, courseSlugs: parseList(safe.courseSlugs) };
}

function slugList(v) {
	if (v === undefined) return undefined;
	if (!Array.isArray(v) || !v.every((s) => typeof s === "string" && s.trim())) {
		fail(400, "courseSlugs must be an array of course slugs.");
	}
	return JSON.stringify([...new Set(v.map((s) => s.trim()))]);
}

async function mustExist(email) {
	const admin = await db.admin.findUnique({ where: { email } });
	if (!admin) fail(404, `Admin "${email}" not found.`);
	return admin;
}

// ── identity ──────────────────────────────────────────────

// public — { email, password } → token
export async function login(input) {
	const email = str(input.email);
	const password = typeof input.password === "string" ? input.password : "";
	if (!email || !password) fail(400, "Email and password are required.");

	const admin = await db.admin.findUnique({ where: { email } });
	const ok = admin && admin.isActive ? await checkPassword(password, admin.password) : false;

	// one message for not-found / inactive / wrong password
	if (!ok) fail(401, "Invalid email or password.");

	return makeAdminToken(admin);
}

// admin — {} → { email, courseSlugs[], role, isSuper, ... }
export async function me(input, ctx) {
	return { ...shape(ctx.admin), isSuper: ctx.isSuper };
}

// ── management (super) ────────────────────────────────────

// { isActive? } → admins
export async function list(input) {
	const where = {};
	if (typeof input.isActive === "boolean") where.isActive = input.isActive;
	return (await db.admin.findMany({ where })).map(shape);
}

// { email } → admin
export async function get(input) {
	return shape(await mustExist(str(input.email)));
}

// { email, password, courseSlugs?, role? } → admin
export async function create(input) {
	const email = str(input.email);
	const password = typeof input.password === "string" ? input.password : "";
	const role = input.role ?? "ADMIN";

	if (!email || !email.includes("@")) fail(400, "A valid email is required.");
	if (password.length < 6) fail(400, "Password must be at least 6 characters.");
	if (!ROLES.includes(role)) fail(400, `role must be ${ROLES.join(" or ")}.`);

	try {
		return shape(await db.admin.create({
			data: {
				email,
				password: await hashPassword(password),
				role,
				courseSlugs: slugList(input.courseSlugs) ?? "[]"
			}
		}));
	} catch (err) {
		if (err.code === "P2002") fail(409, "This email is already an admin.");
		throw err;
	}
}

// { email, changes: { password?, courseSlugs?, role?, isActive? } } → admin
export async function update(input, ctx) {
	const email = str(input.email);
	const changes = input.changes ?? {};
	await mustExist(email);

	const data = {};
	if (changes.password !== undefined) {
		if (typeof changes.password !== "string" || changes.password.length < 6) {
			fail(400, "Password must be at least 6 characters.");
		}
		data.password = await hashPassword(changes.password);
	}
	if (changes.courseSlugs !== undefined) data.courseSlugs = slugList(changes.courseSlugs);
	if (changes.role !== undefined) {
		if (!ROLES.includes(changes.role)) fail(400, `role must be ${ROLES.join(" or ")}.`);
		data.role = changes.role;
	}
	if (changes.isActive !== undefined) data.isActive = !!changes.isActive;

	if (!Object.keys(data).length) fail(400, "Nothing to update.");

	// lock-out guard: a super admin cannot demote or deactivate themselves
	if (email === ctx.admin.email && (data.role === "ADMIN" || data.isActive === false)) {
		fail(400, "You cannot demote or deactivate your own account.");
	}

	return shape(await db.admin.update({ where: { email }, data }));
}

// { email } → ok
export async function remove(input, ctx) {
	const email = str(input.email);
	if (email === ctx.admin.email) fail(400, "You cannot delete your own account.");
	await mustExist(email);
	await db.admin.delete({ where: { email } });
	return { ok: true };
}

// { email, courseSlug } → admin
export async function assignCourse(input) {
	const email = str(input.email);
	const courseSlug = str(input.courseSlug);
	if (!courseSlug) fail(400, "courseSlug is required.");
	const admin = await mustExist(email);
	if (!(await db.course.findUnique({ where: { slug: courseSlug } }))) fail(404, `Course "${courseSlug}" not found.`);

	const list = parseList(admin.courseSlugs);
	if (!list.includes(courseSlug)) list.push(courseSlug);
	return shape(await db.admin.update({ where: { email }, data: { courseSlugs: JSON.stringify(list) } }));
}

// { email, courseSlug } → admin
export async function unassignCourse(input) {
	const email = str(input.email);
	const courseSlug = str(input.courseSlug);
	if (!courseSlug) fail(400, "courseSlug is required.");
	const admin = await mustExist(email);

	const list = parseList(admin.courseSlugs).filter((s) => s !== courseSlug);
	return shape(await db.admin.update({ where: { email }, data: { courseSlugs: JSON.stringify(list) } }));
}