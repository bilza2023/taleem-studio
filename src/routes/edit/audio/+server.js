import { json } from "@sveltejs/kit";
import { requireAdmin } from "$lib/server/auth/requireAdmin.js";
import {
	getAudio,
	updateAudio,
	deleteAudio
} from "$lib/server/audio.js";


export async function GET({ request, url }) {
	try {
		await requireAdmin(request);

		const slug = url.searchParams.get("slug");

		if (!slug) {
			return json(
				{ error: "Slug required" },
				{ status: 400 }
			);
		}

		const audio = await getAudio(slug);

		if (!audio) {
			return json(
				{ error: "Audio not found" },
				{ status: 404 }
			);
		}

		return json(audio);

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}


export async function PUT({ request, url }) {
	try {
		await requireAdmin(request);

		const slug = url.searchParams.get("slug");

		if (!slug) {
			return json(
				{ error: "Slug required" },
				{ status: 400 }
			);
		}

		const data = await request.json();

		// identity stays fixed
		delete data.slug;
		delete data.createdAt;
		delete data.updatedAt;

		const audio = await updateAudio(slug, data);

		return json(audio);

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}


export async function DELETE({ request, url }) {
	try {
		await requireAdmin(request);

		const slug = url.searchParams.get("slug");

		if (!slug) {
			return json(
				{ error: "Slug required" },
				{ status: 400 }
			);
		}

		await deleteAudio(slug);

		return json({
			deleted: slug
		});

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}