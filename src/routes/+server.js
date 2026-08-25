import { json } from "@sveltejs/kit";
import { requireAdmin } from "$lib/server/auth/requireAdmin.js";
import { listCourses } from "$lib/server/course.js";

export async function GET({ request }) {
	try {
		await requireAdmin(request);

		const courses = await listCourses();

		return json(courses);
	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 500 }
		);
	}
}