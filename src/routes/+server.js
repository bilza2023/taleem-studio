import { json } from '@sveltejs/kit';
import kernel from 'taleem-kernel';

export async function GET() {
  try {
    const courses = await kernel.course.list();
    return json(courses);
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 500 });
  }
}