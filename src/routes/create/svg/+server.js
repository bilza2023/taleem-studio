// src/routes/create/svg/+server.js

import { json } from "@sveltejs/kit";
import { requireAdmin } from "$lib/server/auth/requireAdmin.js";
import { createSvg } from "$lib/server/svg.js";

export async function POST({ request }) {
	try {
		await requireAdmin(request);

		const data = await request.json();

		const svg = await createSvg(data);

		return json(svg, { status: 201 });
	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}