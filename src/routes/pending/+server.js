import { json } from "@sveltejs/kit";
import { requireAdminForCourse } from "$lib/server/auth/requireAdmin.js";
import {
	getCourse,
	getGroups,
	getGroupItems
} from "$lib/server/course.js";
import { listLibraryByGroup } from "$lib/server/library.js";

export async function GET({ request, url }) {
	try {
		const courseSlug = url.searchParams.get("course");

		if (!courseSlug) {
			return json(
				{ error: "Course is required" },
				{ status: 400 }
			);
		}

		await requireAdminForCourse(request, courseSlug);

		const course = await getCourse(courseSlug);

		if (!course) {
			return json(
				{ error: `Course "${courseSlug}" not found.` },
				{ status: 404 }
			);
		}

		const groups = await getGroups(courseSlug);
		const pending = [];

		for (const group of groups) {
			const itemSlugs = await getGroupItems(
				courseSlug,
				group.slug
			);

			const libraryItems = await listLibraryByGroup(
				courseSlug,
				group.slug
			);

			const existing = new Set(
				libraryItems.map(item => item.slug)
			);

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

		return json({ course, pending });

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 500 }
		);
	}
}