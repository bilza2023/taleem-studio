import { json } from "@sveltejs/kit";
import kernel from "taleem-kernel";

export async function GET({ url }) {
	try {
		const courseSlug = url.searchParams.get("course");

		if (!courseSlug) {
			return json({ error: "Course is required" }, { status: 400 });
		}

		const course = await kernel.course.get(courseSlug);

		if (!course) {
			return json(
				{ error: `Course "${courseSlug}" not found.` },
				{ status: 404 }
			);
		}

		const groups = await kernel.course.getGroups(courseSlug);
		const pending = [];
        // console.log("GROUPS:", groups);
		for (const group of groups) {
			const itemSlugs = await kernel.course.getGroupItems(
				courseSlug,
				group.slug
			);

			const libraryItems = await kernel.library.listByGroup(
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