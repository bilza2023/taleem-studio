// src/lib/server/server.js

import { api } from "./api.js";
import { buildContext, checkAccess, fail } from "./access.js";

export async function request({ module, method, data, userToken = null, adminToken = null }) {
	const feature = Object.hasOwn(api, module) ? api[module] : null;
	if (!feature) fail(404, `Unknown module: ${module}`);

	const entry = Object.hasOwn(feature, method) ? feature[method] : null;
	if (!entry) fail(404, `Method not implemented: ${module}.${method}`);

	const input = data ?? {};
	if (typeof input !== "object" || Array.isArray(input)) fail(400, "Input must be an object.");

	const ctx = await buildContext({ userToken, adminToken });
	await checkAccess(entry, input, ctx);

	return entry.run(input, ctx);
}