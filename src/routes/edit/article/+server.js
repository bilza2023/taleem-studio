import { json } from '@sveltejs/kit';
import { getLibrary, updateLibrary } from '../../../../db/library.js';

export async function GET({ url }) {
  try {
    const slug = url.searchParams.get('slug');

    if (!slug) return json({ error: 'Slug is required' }, { status: 400 });

    const article = await getLibrary(slug);

    if (!article) return json({ error: 'Article not found' }, { status: 404 });

    return json(article);
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

    delete data.type;
    delete data.createdAt;
    delete data.updatedAt;

    const article = await updateLibrary(slug, data);

    return json(article);
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 400 });
  }
}