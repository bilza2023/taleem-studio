// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/backend/admin.js

import kernel from "taleem-kernel";
import { requireSuperAdmin } from "./utils/requireSuperAdmin.js";

export async function loginAdmin(email, password) {
	return kernel.admin.login(email, password);
}

export async function authenticateAdmin(token) {
	if (!token) return null;
	return kernel.admin.authenticate(token);
}

export async function authorizeAdmin(email, courseSlug) {
	return kernel.admin.isAdmin(email, courseSlug);
}

export async function listAdmins(filters, token) {
	await requireSuperAdmin(token);

	return kernel.admin.list(filters);
}

export async function getAdmin(email, token) {
	await requireSuperAdmin(token);

	return kernel.admin.get(email);
}

export async function createAdmin(data, token) {
	await requireSuperAdmin(token);

	return kernel.admin.create(data);
}

export async function updateAdmin(email, data, token) {
	await requireSuperAdmin(token);

	const existing = await kernel.admin.get(email);

	if (!existing) {
		const err = new Error(`Admin "${email}" not found.`);
		err.status = 404;
		throw err;
	}

	return kernel.admin.update(email, data);
}

export async function deleteAdmin(email, token) {
	await requireSuperAdmin(token);

	const existing = await kernel.admin.get(email);

	if (!existing) {
		const err = new Error(`Admin "${email}" not found.`);
		err.status = 404;
		throw err;
	}

	return kernel.admin.delete(email);
}

export async function assignCourseToAdmin(email, courseSlug, token) {
	await requireSuperAdmin(token);

	return kernel.admin.assignCourse(email, courseSlug);
}

export async function unassignCourseFromAdmin(email, courseSlug, token) {
	await requireSuperAdmin(token);

	return kernel.admin.unassignCourse(email, courseSlug);
}