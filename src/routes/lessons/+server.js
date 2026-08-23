import { json } from '@sveltejs/kit';
import kernel from 'taleem-kernel';

export async function GET({ url }) {
	try {
		const courseSlug = url.searchParams.get('course');

		if (!courseSlug) {
			return json({ error: 'Course is required' }, { status: 400 });
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

		if (typeof course.groupings === 'string') {
			try {
				course.groupings = JSON.parse(course.groupings || '[]');
			} catch {
				course.groupings = [];
			}
		}

		const items = await kernel.library.list({
			course: courseSlug,
			sort: 'sortOrder'
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