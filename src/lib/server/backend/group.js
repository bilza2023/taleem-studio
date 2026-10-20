///home/bilal-tariq/00--TALEEM/taleem/src/lib/server/backend/group.js
import kernel from "../../taleem-kernel";
import { requireAdminForCourse } from "./utils/requireAdmin.js";

export async function listGroups(courseSlug) {
	return kernel.group.listByCourse(courseSlug);
}

export async function getGroup(courseSlug, groupSlug) {
	return kernel.group.get(courseSlug, groupSlug);
}

export async function createGroup(data, token) {
	await requireAdminForCourse(token, data.courseSlug);
	return kernel.group.create(data);
}

export async function updateGroup(courseSlug, groupSlug, data, token) {
	await requireAdminForCourse(token, courseSlug);

	const existing = await kernel.group.get(courseSlug, groupSlug);
	if (!existing) {
		const err = new Error(`Group "${groupSlug}" not found in course "${courseSlug}".`);
		err.status = 404;
		throw err;
	}

	return kernel.group.update(courseSlug, groupSlug, data);
}

export async function deleteGroup(courseSlug, groupSlug, token) {
	await requireAdminForCourse(token, courseSlug);

	const existing = await kernel.group.get(courseSlug, groupSlug);
	if (!existing) {
		const err = new Error(`Group "${groupSlug}" not found in course "${courseSlug}".`);
		err.status = 404;
		throw err;
	}

	return kernel.group.delete(courseSlug, groupSlug);
}

export async function reorderGroups(courseSlug, slugs, token) {
	await requireAdminForCourse(token, courseSlug);

	if (!Array.isArray(slugs) || !slugs.every((s) => typeof s === "string" && s)) {
		const err = new Error("slugs must be an array of group slugs.");
		err.status = 400;
		throw err;
	}

	return kernel.group.reorder(courseSlug, slugs);
}