
import { json } from '@sveltejs/kit';
import { getLibrary, updateLibrary } from '../../../../db/library.js';

export async function GET({ url }) {
  try {
    const slug = url.searchParams.get('slug');

    if (!slug) return json({ error: 'Slug is required' }, { status: 400 });

    const player = await getLibrary(slug);

    if (!player) return json({ error: 'Player not found' }, { status: 404 });

    if (player.type !== 'PLAYER') {
      return json({ error: 'Library item is not a Player' }, { status: 400 });
    }

    return json(player);
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

    const player = await updateLibrary(slug, data);

    return json(player);
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 400 });
  }
}