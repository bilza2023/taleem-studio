// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/server.js

import { backend } from "./backend.js";

export async function request({ method, module, data }) {
	method = method.toLowerCase();

	if (!backend[module]) {
		throw new Error(`Unknown module: ${module}`);
	}

	const handler = backend[module][method];

	if (!handler) {
		throw new Error(`Method not implemented: ${module}.${method}`);
	}

	return await handler(data);
}