// src/lib/server/access.js
// The ONLY place that knows about tokens and roles.

import { db } from "./db.js";
import { verifyToken } from "./auth.js";

export function fail(status, message) {
	const err = new Error(message);
	err.status = status;
	throw err;
}

function strip(row) {
	if (!row) return null;
	const { password, ...safe } = row;
	return safe;
}

function parseList(s) {
	try {
		const v = JSON.parse(s ?? "[]");
		return Array.isArray(v) ? v : [];
	} catch {
		return [];
	}
}

// token → student row. A token of the wrong type is rejected.
async function loadUser(token) {
	const payload = verifyToken(token);
	if (payload.type !== "user") throw new Error("not a user token");
	const user = await db.user.findUnique({ where: { id: payload.id } });
	if (!user) throw new Error("user not found");
	return user;
}

// token → active admin row.
async function loadAdmin(token) {
	const payload = verifyToken(token);
	if (payload.type !== "admin") throw new Error("not an admin token");
	const admin = await db.admin.findUnique({ where: { email: payload.email } });
	if (!admin || !admin.isActive) throw new Error("admin missing or inactive");
	return admin;
}

// Build ctx once per request. A bad token on a public method is treated as "anonymous".
export async function buildContext({ userToken, adminToken }) {
	const ctx = {
		user: null,
		admin: null,
		isSuper: false,
		adminCourses: [],
		badUserToken: false,
		badAdminToken: false
	};

	if (userToken) {
		try {
			ctx.user = strip(await loadUser(userToken));
		} catch {
			ctx.badUserToken = true;
		}
	}

	if (adminToken) {
		try {
			const admin = await loadAdmin(adminToken);
			ctx.admin = strip(admin);
			ctx.isSuper = admin.role === "SUPER_ADMIN";
			ctx.adminCourses = parseList(admin.courseSlugs);
		} catch {
			ctx.badAdminToken = true;
		}
	}

	return ctx;
}

// For handlers that need it (e.g. library.get showing drafts).
export function canTeach(ctx, courseSlug) {
	if (!ctx.admin) return false;
	if (ctx.isSuper) return true;
	return ctx.adminCourses.includes(courseSlug);
}

// Course resolvers for "teacher" methods.
export const from = {
	input: async (input) => {
		if (!input.courseSlug) fail(400, "courseSlug is required.");
		return input.courseSlug;
	},
	library: async (input) => {
		const item = await db.library.findUnique({
			where: { slug: String(input.slug ?? "") },
			select: { courseSlug: true }
		});
		if (!item) fail(404, "Item not found.");
		return item.courseSlug;
	},
	inquiry: async (input) => {
		const item = await db.inquiry.findUnique({
			where: { id: Number(input.id) || 0 },
			select: { courseSlug: true }
		});
		if (!item) fail(404, "Inquiry not found.");
		return item.courseSlug; // may be null → only super passes
	}
};

function requireStudent(ctx) {
	if (!ctx.user) fail(401, ctx.badUserToken ? "Invalid or expired login." : "Student login required.");
}

function requireAdmin(ctx) {
	if (!ctx.admin) fail(401, ctx.badAdminToken ? "Invalid or expired admin login." : "Admin login required.");
}

export async function checkAccess(entry, input, ctx) {
	switch (entry.access) {
		case "public":
			return;

		case "student":
			return requireStudent(ctx);

		case "admin":
			return requireAdmin(ctx);

		case "super":
			requireAdmin(ctx);
			if (!ctx.isSuper) fail(403, "Super admin access required.");
			return;

		case "teacher": {
			requireAdmin(ctx);
			if (ctx.isSuper) return; // decided: super passes every teacher check
			if (!entry.course) throw new Error("Contract error: teacher method has no course resolver.");
			const courseSlug = await entry.course(input);
			if (!courseSlug || !ctx.adminCourses.includes(courseSlug)) {
				fail(403, `Not authorized for course "${courseSlug ?? "none"}".`);
			}
			return;
		}

		default:
			throw new Error(`Contract error: unknown access level "${entry.access}".`);
	}
}