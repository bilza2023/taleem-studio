///home/bilal-tariq/00--TALEEM/taleem.studio/db/library.js
import kernel from 'taleem-kernel';
import { requireAdminForCourse } from "./utils/requireAdmin.js";

const VALID_TYPES = ["ARTICLE", "PLAYER"];

export async function createLibrary(data, token) {
	if (!VALID_TYPES.includes(data.type)) {
		const err = new Error(`Invalid type: ${data.type}`);
		err.status = 400;
		throw err;
	}

	await requireAdminForCourse(token, data.courseSlug);

	return kernel.library.create(data);
}

export async function getLibrary(slug) {
	return kernel.library.get(slug);
}

export async function listLibrary(filters) {
	return kernel.library.list(filters);
}

export async function updateLibrary(slug, data, token) {
	const existing = await kernel.library.get(slug);

	if (!existing) {
		const err = new Error(`Library item "${slug}" not found.`);
		err.status = 404;
		throw err;
	}

	await requireAdminForCourse(token, existing.courseSlug);

	return kernel.library.update(slug, data);
}

export async function deleteLibrary(slug, token) {
	const existing = await kernel.library.get(slug);

	if (!existing) {
		const err = new Error(`Library item "${slug}" not found.`);
		err.status = 404;
		throw err;
	}

	await requireAdminForCourse(token, existing.courseSlug);

	return kernel.library.delete(slug);
}

export async function listLibraryByGroup(courseSlug, groupSlug) {
	return kernel.library.listByGroup(courseSlug, groupSlug);
}