// src/lib/timings/publishAudio.js
// recording blob → server (/admin/timings/publish) → { audio, sizeMb, created } or throws

import { config } from "$lib/config.js";

export async function publishAudio(slug, blob) {
	const form = new FormData();
	form.append("slug", slug);
	form.append("audio", blob, `${slug}.webm`);

	const token = localStorage.getItem("taleem-admin-token");

	let res;
	try {
		res = await fetch(`${config.basePath}/admin/timings/publish`, {
			method: "POST",
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			body: form
		});
	} catch {
		throw new Error("Unable to contact Taleem Server.");
	}

	const out = await res.json().catch(() => ({}));
	if (!res.ok) throw new Error(out.error ?? `HTTP ${res.status}`);

	return out;
}