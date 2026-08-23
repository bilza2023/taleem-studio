
import { json } from '@sveltejs/kit';
import { getSvg, updateSvg } from '../../../../db/svg.js';

export async function GET({ url }) {
  try {
    const slug = url.searchParams.get('slug');

    if (!slug) return json({ error: 'Slug is required' }, { status: 400 });

    const svg = await getSvg(slug);

    if (!svg) return json({ error: 'SVG not found' }, { status: 404 });

    return json(svg);
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 500 });
  }
}

export async function PUT({ request, url }) {
  try {
    const slug = url.searchParams.get('slug');

    if (!slug) return json({ error: 'Slug is required' }, { status: 400 });

    const data = await request.json();

    delete data.createdAt;
    delete data.updatedAt;

    const svg = await updateSvg(slug, data);

    return json(svg);
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 400 });
  }
}