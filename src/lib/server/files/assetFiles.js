// src/lib/server/files/assetFiles.js
// Files on disk for images / audio, and serving svg rows as files.

import { mkdir, writeFile, access, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "$lib/config.js";
import { db } from "../db.js";
import { fail } from "../access.js";

export const IMAGE_DIR = config.imageDir;
export const AUDIO_DIR = path.join(config.contentDir, "audio");

const MIME = {
	".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
	".gif": "image/gif", ".svg": "image/svg+xml",
	".mp3": "audio/mpeg", ".wav": "audio/wav", ".opus": "audio/ogg", ".ogg": "audio/ogg"
};

const UPLOAD = {
	image: { dir: IMAGE_DIR, ok: (t) => ["image/png", "image/jpeg", "image/webp", "image/gif"].includes(t) },
	audio: { dir: AUDIO_DIR, ok: (t) => t.startsWith("audio/") }
};

// save an uploaded File; returns the filename (= the asset slug). 400 bad type, 409 exists.
export async function saveUpload(type, file) {
	const cfg = UPLOAD[type];
	if (!cfg) fail(400, `Unknown upload type: ${type}`);
	if (!(file instanceof File)) fail(400, `${type} file is required.`);
	if (!cfg.ok(file.type)) fail(400, `Unsupported ${type} type: ${file.type || "unknown"}`);

	const filename = path.basename(file.name || "");
	if (!filename) fail(400, "Invalid filename.");

	const filePath = path.join(cfg.dir, filename);
	try {
		await access(filePath);
		fail(409, `File already exists: ${filename}`);
	} catch (err) {
		if (err.status) throw err;          // our 409
		if (err.code !== "ENOENT") throw err; // real disk error
	}

	await mkdir(cfg.dir, { recursive: true });
	await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
	return filename;
}

// delete a file; a missing file is not an error
async function removeFile(dir, slug) {
	try {
		await unlink(path.join(dir, path.basename(slug)));
	} catch (err) {
		if (err.code !== "ENOENT") throw err;
	}
}
export const deleteImageFile = (slug) => removeFile(IMAGE_DIR, slug);
export const deleteAudioFile = (slug) => removeFile(AUDIO_DIR, slug);
export const deleteUploaded = (type, slug) => removeFile(UPLOAD[type].dir, slug);

// serve /content/<path> → { data, contentType }. 403 on ../ escapes, 404 when missing.
export async function serveAsset(relativePath) {
	if (!relativePath) fail(404, "Asset path required.");
	const ext = path.extname(relativePath).toLowerCase();

	if (ext === ".svg") {
		const file = path.basename(relativePath);         // keeps .svg — the slug rule
		const row =
			(await db.svg.findUnique({ where: { slug: file } })) ??
			(await db.svg.findUnique({ where: { slug: file.replace(/\.svg$/i, "") } })); // old rows saved without .svg
		if (!row) fail(404, `SVG not found: ${file}`);
		return { data: row.body, contentType: "image/svg+xml" };
	}

	const root = path.resolve(config.contentDir);
	const filePath = path.resolve(root, relativePath);
	if (!filePath.startsWith(root + path.sep)) fail(403, "Forbidden.");

	try {
		return { data: await readFile(filePath), contentType: MIME[ext] || "application/octet-stream" };
	} catch (err) {
		if (err.code === "ENOENT") fail(404, "Asset not found.");
		throw err;
	}
}