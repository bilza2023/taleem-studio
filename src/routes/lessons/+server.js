import { json } from "@sveltejs/kit";
import kernel from "taleem-kernel";
import { requireAdminForCourse } from "$lib/utils/requireAdminForCourse.js";
// import { requireAdmin } from "$lib/utils/requireAdmin.js";

export async function GET({ request, url }) {
	try {
		const courseSlug = url.searchParams.get("course");

		if (!courseSlug) {
			return json({ error: "Course is required" }, { status: 400 });
		}

		let admin;

		try {
			admin = await requireAdminForCourse(request, courseSlug);
		} catch (error) {
			const message = error.message || "Admin authentication failed";

			if (message === "Authentication required" || message.includes("authentication")) {
				return json({ error: message }, { status: 401 });
			}

			if (message.includes("not authorized")) {
				return json({ error: message }, { status: 403 });
			}

			return json({ error: message }, { status: 401 });
		}

		const courses = await kernel.course.list();

		const course = courses.find(
			item => item.slug === courseSlug
		);

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

		const items = await kernel.library.list({
			course: courseSlug,
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