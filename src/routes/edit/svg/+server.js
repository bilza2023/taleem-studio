// src/routes/edit/svg/+server.js

import { json } from "@sveltejs/kit";
import { requireAdmin } from "$lib/server/auth/requireAdmin.js";
import {
	getSvg,
	updateSvg
} from "$lib/server/svg.js";


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

		const svg = await getSvg(slug);

		if (!svg) {
			return json(
				{ error: "SVG not found" },
				{ status: 404 }
			);
		}

		return json(svg);

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

		delete data.slug;
		delete data.createdAt;
		delete data.updatedAt;

		const svg = await updateSvg(slug, data);

		return json(svg);

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}