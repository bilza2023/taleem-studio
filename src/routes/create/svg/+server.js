import { json } from '@sveltejs/kit';
import { createSvg } from '../../../../db/svg.js';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const svg = await createSvg(data);
    return json(svg, { status: 201 });
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 400 });
  }
}