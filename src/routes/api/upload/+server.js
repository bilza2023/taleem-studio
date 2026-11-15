// src/routes/api/upload/+server.js
// multipart upload: type ("image" | "audio"), file, title?, tags? (JSON text)

import { json } from "@sveltejs/kit";
import { guard, errorResponse } from "$lib/server/http.js";
import { fail } from "$lib/server/access.js";
import { saveUpload, deleteUploaded } from "$lib/server/files/assetFiles.js";
import * as image from "$lib/server/modules/image.js";
import * as audio from "$lib/server/modules/audio.js";

const MODULES = { image, audio };

function tagsFrom(form) {
	try {
		const v = JSON.parse(form.get("tags") || "[]");
		return Array.isArray(v) ? v : [];
	} catch {
		return [];
	}
}

export async function POST({ request }) {
	try {
		await guard(request, { access: "admin" });

		const form = await request.formData();
		const type = form.get("type");
		if (!MODULES[type]) fail(400, "Upload type must be image or audio.");

		const slug = await saveUpload(type, form.get("file"));

		try {
			const row = await MODULES[type].create({
				slug,
				title: form.get("title") || slug,
				tags: tagsFrom(form)
			});
			return json(row, { status: 201 });
		} catch (err) {
			await deleteUploaded(type, slug); // no orphan file if the row fails
			throw err;
		}
	} catch (err) {
		return errorResponse(err);
	}
}