import { json } from "@sveltejs/kit";
import { request } from "$lib/server/dispatcher.js";
import { tokensFrom, errorResponse } from "$lib/server/http.js";

export async function POST({ request: req }) {
	try {
		const { module, method, data } = await req.json();
		const result = await request({ module, method, data, ...tokensFrom(req) });
		return json(result ?? null);
	} catch (err) {
		return errorResponse(err);
	}
}