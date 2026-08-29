// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/pending.js

import { getCourse, getGroups, getGroupItems } from "./course.js";
import { listLibraryByGroup } from "./library.js";
import { requireAdminForCourse } from "./utils/requireAdmin.js";

export async function getPendingContent(courseSlug, token) {
	await requireAdminForCourse(token, courseSlug);

	const course = await getCourse(courseSlug);

	if (!course) {
		const err = new Error(`Course "${courseSlug}" not found.`);
		err.status = 404;
		throw err;
	}

	const groups = await getGroups(courseSlug);
	const pending = [];

	for (const group of groups) {
		const itemSlugs = await getGroupItems(courseSlug, group.slug);
		const libraryItems = await listLibraryByGroup(courseSlug, group.slug);
		const existing = new Set(libraryItems.map(item => item.slug));

		for (const slug of itemSlugs) {
			if (!existing.has(slug)) {
				pending.push({
					slug,
					groupSlug: group.slug,
					groupTitle: group.title
				});
			}
		}
	}

	return { course, pending };
}