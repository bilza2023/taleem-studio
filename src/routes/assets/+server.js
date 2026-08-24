
import { json } from '@sveltejs/kit';
import { listAssets } from '../../../db/assets.js';

export async function GET() {
  try {
    const assets = await listAssets();
    return json(assets);
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 500 });
  }
}