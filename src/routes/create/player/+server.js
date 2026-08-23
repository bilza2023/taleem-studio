
import { json } from '@sveltejs/kit';
import { createPlayer } from '../../../../db/library.js';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const player = await createPlayer(data);
    return json(player, { status: 201 });
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 400 });
  }
}