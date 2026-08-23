
import { json } from '@sveltejs/kit';
import { createImage } from '../../../../db/image.js';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const image = await createImage(data);
    return json(image, { status: 201 });
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 400 });
  }
}