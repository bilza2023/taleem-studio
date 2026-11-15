// src/routes/admin/timings/publish/+server.js
// POST (multipart): slug + audio (webm)  →  content/audio/<slug>.opus + Audio row (if missing)
// If <slug>.opus already exists, a copy goes to the archive before it is replaced.
// Teacher of the lesson's course (super passes). Does NOT touch the deck — the page saves the deck after this succeeds.

import { json } from "@sveltejs/kit";
import { writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { db } from "$lib/server/db.js";
import { from } from "$lib/server/access.js";
import { guard, errorResponse } from "$lib/server/http.js";
import { AUDIO_DIR, encodeOpus, archiveRaw, archiveCopy, fileSizeMb } from "$lib/server/files/audioFiles.js";

const SLUG_RX = /^[a-zA-Z0-9._-]+$/;

export async function POST({ request }) {
	// 1. Input (needed first: access depends on the lesson's course)
	let form;
	try {
		form = await request.formData();
	} catch {
		return json({ error: "Expected multipart form data" }, { status: 400 });
	}

	const slug = String(form.get("slug") ?? "");
	const file = form.get("audio");

	if (!SLUG_RX.test(slug)) return json({ error: "Invalid slug" }, { status: 400 });

	// 2. Access: teacher of this lesson's course (401 / 403 / 404 if no such lesson)
	try {
		await guard(request, { access: "teacher", course: from.library }, { slug });
	} catch (err) {
		return errorResponse(err);
	}

	if (!file || typeof file === "string" || !file.size) {
		return json({ error: "No audio file received" }, { status: 400 });
	}

	// 3. Must be a PLAYER lesson
		const lesson = await db.library.findUnique({ where: { slug }, select: { type: true } });
	if (!lesson) return json({ error: `No lesson "${slug}"` }, { status: 404 });
	if (lesson.type !== "PLAYER") return json({ error: `"${slug}" is not a Player` }, { status: 400 });

	// 4. Process
	const name = `${slug}.opus`;
	const out = join(AUDIO_DIR, name);
	const tmp = join(tmpdir(), `${slug}-${Date.now()}.webm`);

	try {
		writeFileSync(tmp, Buffer.from(await file.arrayBuffer()));

		const replaced = existsSync(out);
		if (replaced) archiveCopy(out, slug); // old version kept before it is replaced

		encodeOpus(tmp, out); // content/audio/<slug>.opus
		archiveRaw(tmp, slug); // raw .webm kept in the archive folder

		// 5. Audio row only if missing
		const existing = await db.audio.findUnique({ where: { slug: name } });
		if (!existing) await db.audio.create({ data: { slug: name, title: name } });

		return json({ ok: true, audio: name, sizeMb: fileSizeMb(out), created: !existing, replaced });
	} catch (err) {
		console.error(err);
		return json({ error: err.message }, { status: 500 }); // admin-only route: ffmpeg's message is useful
	} finally {
		if (existsSync(tmp)) unlinkSync(tmp);
	}
}