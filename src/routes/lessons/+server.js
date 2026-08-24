import { json } from "@sveltejs/kit";
import { requireAdminForCourse } from "$lib/server/auth/requireAdmin.js";
import { getCourse } from "$lib/server/course.js";
import { listLibrary } from "$lib/server/library.js";

export async function GET({ request, url }) {
	try {
		const courseSlug = url.searchParams.get("course");

		if (!courseSlug) {
			return json({ error: "Course is required" }, { status: 400 });
		}

		await requireAdminForCourse(request, courseSlug);

		const course = await getCourse(courseSlug);

		if (!course) {
			return json(
				{ error: `Course "${courseSlug}" not found.` },
				{ status: 404 }
			);
		}

		if (typeof course.groupings === "string") {
			try {
				course.groupings = JSON.parse(course.groupings || "[]");
			} catch {
				course.groupings = [];
			}
		}

		const items = await listLibrary({
	courseSlug,
	sort: "sortOrder"
});

		return json({ course, items });

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 500 }
		);
	}
}