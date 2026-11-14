// src/lib/server/backend/guards.js
import kernel from "../../taleem-kernel";
import { authenticateAdmin } from "./admin.js";

export const requireStudent = (token) => kernel.user.authenticate(token);

export async function requireAdmin(token) {
	return authenticateAdmin(token);
}

export function isSuper(admin) {
	return admin?.role === "SUPER_ADMIN";
}

export function adminCourses(admin) {
	try { return JSON.parse(admin?.courseSlugs ?? "[]"); } catch { return []; }
}

export function assertCourse(admin, courseSlug) {
	if (isSuper(admin)) return;
	if (!courseSlug || !adminCourses(admin).includes(courseSlug)) {
		const err = new Error("Not allowed for this course.");
		err.status = 403;
		throw err;
	}
}

export function fail(message, status = 400) {
	const err = new Error(message);
	err.status = status;
	return err;
}