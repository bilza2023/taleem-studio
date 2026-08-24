import { json } from "@sveltejs/kit";
import { getLibrary } from "$lib/server/library.js";

export async function GET({ url }) {
	try {
		const slug = url.searchParams.get("lesson");

		if (!slug) {
			return json(
				{ error: "Lesson is required" },
				{ status: 400 }
			);
		}

		const item = await getLibrary(slug);

		if (!item) {
			return json(
				{ error: "Player not found" },
				{ status: 404 }
			);
		}

		if (item.type !== "PLAYER") {
			return json(
				{ error: "Library item is not a Player" },
				{ status: 400 }
			);
		}

		return json(item);

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 500 }
		);
	}
}