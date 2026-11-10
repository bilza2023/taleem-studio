// src/routes/admin/timings/publish/+server.js
// POST (multipart): slug + audio (webm)  →  content/audio/<slug>.opus + Audio row (if missing)
// Admin only. Does NOT touch the deck — the page saves the deck after this succeeds.

import { json } from "@sveltejs/kit";
import { writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import kernel from "$lib/taleem-kernel";
import { authenticateAdmin } from "$lib/server/backend/admin.js";
import { AUDIO_DIR, encodeOpus, archiveRaw, fileSizeMb } from "$lib/server/audioFiles.js";

const SLUG_RX = /^[a-zA-Z0-9._-]+$/;

export async function POST({ request }) {
	// 1. Admin only
	const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
	let admin = null;
	try {
		admin = token ? await authenticateAdmin(token) : null;
	} catch {
		admin = null;
	}
	if (!admin) return json({ error: "Admin login required" }, { status: 401 });

	// 2. Input
	let form;
	try {
		form = await request.formData();
	} catch {
		return json({ error: "Expected multipart form data" }, { status: 400 });
	}

	const slug = String(form.get("slug") ?? "");
	const file = form.get("audio");

	if (!SLUG_RX.test(slug)) return json({ error: "Invalid slug" }, { status: 400 });
	if (!file || typeof file === "string" || !file.size) {
		return json({ error: "No audio file received" }, { status: 400 });
	}

	// 3. Must be a real PLAYER lesson
	const lesson = await kernel.library.get(slug, { includeUnpublished: true });
	if (!lesson) return json({ error: `No lesson "${slug}"` }, { status: 404 });
	if (lesson.type !== "PLAYER") return json({ error: `"${slug}" is not a Player` }, { status: 400 });

	// 4. Process
	const name = `${slug}.opus`;
	const out = join(AUDIO_DIR, name);
	const tmp = join(tmpdir(), `${slug}-${Date.now()}.webm`);

	try {
		writeFileSync(tmp, Buffer.from(await file.arrayBuffer()));
		encodeOpus(tmp, out); // content/audio/<slug>.opus (replaced if present)
		archiveRaw(tmp, slug); // raw .webm kept in the archive folder

		// 5. Audio row only if missing
		const existing = await kernel.audio.get(name);
		if (!existing) await kernel.audio.create({ slug: name, title: name });

		return json({
			ok: true,
			audio: name,
			sizeMb: fileSizeMb(out),
			created: !existing
		});
	} catch (err) {
		console.error(err);
		return json({ error: err.message }, { status: 500 });
	} finally {
		if (existsSync(tmp)) unlinkSync(tmp);
	}
}