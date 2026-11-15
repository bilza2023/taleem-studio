// src/lib/server/http.js
// For SvelteKit routes that can't go through the dispatcher (file uploads, file serving).
// Same tokens, same access rules, same error shape as the dispatcher.

import { json } from "@sveltejs/kit";
import { buildContext, checkAccess } from "./access.js";

// both header styles: new (send) and old Bearer (pages using their own fetch)
export function tokensFrom(request) {
	const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
	return {
		userToken: request.headers.get("x-user-token"),
		adminToken: request.headers.get("x-admin-token") ?? bearer
	};
}

// throws with err.status if not allowed; returns ctx
export async function guard(request, rule, input = {}) {
	const ctx = await buildContext(tokensFrom(request));
	await checkAccess(rule, input, ctx);
	return ctx;
}

// expected errors keep their status; anything else is a logged 500 with no internals leaked
export function errorResponse(err) {
	if (err?.status) return json({ error: err.message }, { status: err.status });
	console.error("[server]", err);
	return json({ error: "Server error." }, { status: 500 });
}