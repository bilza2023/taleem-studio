

// /home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/api/server/+server.js

import { json } from "@sveltejs/kit";
import { request as serverRequest } from "$lib/server/server.js";

export async function GET({ request, url }) {
	const module = url.searchParams.get("module");
	const data = JSON.parse(url.searchParams.get("data") || "{}");

	return json(await serverRequest({
		method: request.method,
		module,
		data
	}));
}

export async function POST({ request }) {
	return json(await serverRequest({
		method: request.method,
		...(await request.json())
	}));
}

export async function PUT({ request }) {
	return json(await serverRequest({
		method: request.method,
		...(await request.json())
	}));
}

export async function PATCH({ request }) {
	return json(await serverRequest({
		method: request.method,
		...(await request.json())
	}));
}

export async function DELETE({ request }) {
	return json(await serverRequest({
		method: request.method,
		...(await request.json())
	}));
}