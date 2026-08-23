import { json } from '@sveltejs/kit';
import { createArticle } from '../../../../db/library.js';

export async function POST({ request }) {
  try {
    const data = await request.json();
    const article = await createArticle(data);
    return json(article, { status: 201 });
  } catch (error) {
    console.error(error);
    return json({ error: error.message }, { status: 400 });
  }
}