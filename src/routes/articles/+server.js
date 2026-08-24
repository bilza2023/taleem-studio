// src/routes/article/+server.js

import { json } from "@sveltejs/kit";
import { getLibrary } from "$lib/server/library.js";

export async function GET({ url }) {
	try {
		const slug = url.searchParams.get("article");

		if (!slug) {
			return json({ error: "Article is required" }, { status: 400 });
		}

		const article = await getLibrary(slug);

		if (!article) {
			return json({ error: "Article not found" }, { status: 404 });
		}

		if (article.type !== "ARTICLE") {
			return json(
				{ error: "Library item is not an Article" },
				{ status: 400 }
			);
		}

		return json(article);
	} catch (error) {
		console.error(error);
		return json({ error: error.message }, { status: 500 });
	}
}