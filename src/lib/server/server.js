// src/routes/api/server/+server.js

import { json } from "@sveltejs/kit";
import { request as dispatch } from "$lib/server/dispatcher.js";
import { tokensFrom, errorResponse } from "$lib/server/http.js";

export async function POST({ request }) {
	try {
		const { module, method, data } = await request.json();
		const result = await dispatch({ module, method, data, ...tokensFrom(request) });
		return json(result ?? null);
	} catch (err) {
		return errorResponse(err);
	}
}