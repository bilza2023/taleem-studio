// src/lib/send/index.js

import { config } from "$lib/config.js";

const ENDPOINT = `${config.basePath}/api/server`;

function readToken(key) {
	if (typeof localStorage === "undefined") return null; // SSR safety
	return localStorage.getItem(key);
}

function getTokens() {
	return {
		user: readToken("taleem-token"),
		admin: readToken("taleem-admin-token")
	};
}

// 4th argument (old tokenType) is accepted but ignored: both tokens are always sent.
export async function send(module, method, data = {}, _tokenType) {
	const { user, admin } = getTokens();

	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			...(user ? { "X-User-Token": user } : {}),
			...(admin ? { "X-Admin-Token": admin } : {})
		},
		body: JSON.stringify({ module, method, data })
	};

	let response;

	try {
		response = await fetch(ENDPOINT, options);
	} catch {
		throw new Error("Unable to contact Taleem Server.");
	}

	const contentType = response.headers.get("content-type") || "";
	const result = contentType.includes("application/json")
		? await response.json()
		: await response.text();

	if (!response.ok) {
		const err = new Error(result?.error || result?.message || `HTTP ${response.status}`);
		err.status = response.status; // pages can branch on 401 / 403 / 404
		throw err;
	}

	return result;
}