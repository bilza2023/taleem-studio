// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/backend/assets.js
import kernel from 'taleem-kernel';
import { mkdir, writeFile, access, unlink } from 'node:fs/promises';
import path from 'node:path';
import { requireAdmin } from './utils/requireAdmin.js';
import { createImage } from './image.js';
import { createAudio } from './audio.js';
import { config } from '$lib/config.js';
import { readFile } from 'node:fs/promises';

const CONTENT_DIR = path.resolve(config.basePath + "/content");

const MIME_TYPES = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".opus": "audio/ogg",
	".ogg": "audio/ogg"
};
export async function listAssets(token) {
	await requireAdmin(token);

	const [images, svgs, audios] = await Promise.all([
		kernel.image.list(),
		kernel.svg.list(),
		kernel.audio.list()
	]);

	return [
		...images.map(asset => ({ ...asset, type: 'IMAGE' })),
		...svgs.map(asset => ({ ...asset, type: 'SVG' })),
		...audios.map(asset => ({ ...asset, type: 'AUDIO' }))
	];
}

const UPLOAD_CONFIG = {
	image: {
		dir: config.imageDir,
		allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
		createFn: createImage
	},
	audio: {
		dir: path.join(config.contentDir, "audio"),
		allowedTypes: null, // any audio/* type accepted
		allowedPrefix: "audio/",
		createFn: createAudio
	}
};

export async function uploadAsset(type, form, token) {
	await requireAdmin(token);

	const cfg = UPLOAD_CONFIG[type];

	if (!cfg) {
		const err = new Error(`Unknown upload type: ${type}`);
		err.status = 400;
		throw err;
	}

	const file = form.get("file");

	if (!(file instanceof File)) {
		const err = new Error(`${type} file is required`);
		err.status = 400;
		throw err;
	}

	const validType = cfg.allowedTypes
		? cfg.allowedTypes.includes(file.type)
		: file.type.startsWith(cfg.allowedPrefix);

	if (!validType) {
		const err = new Error(`Unsupported ${type} type`);
		err.status = 400;
		throw err;
	}

	const filename = path.basename(file.name);

	if (!filename) {
		const err = new Error("Invalid filename");
		err.status = 400;
		throw err;
	}

	const filePath = path.join(cfg.dir, filename);

	try {
		await access(filePath);
		const err = new Error(`File already exists: ${filename}`);
		err.status = 409;
		throw err;
	} catch (err) {
		if (err.code !== "ENOENT") throw err; // real error, not "doesn't exist"
	}

	await mkdir(cfg.dir, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	await writeFile(filePath, buffer);

	try {
		return await cfg.createFn({
			slug: filename,
			title: form.get("title") || filename,
			tags: form.get("tags") || "[]"
		}, token);
	} catch (dbErr) {
		await unlink(filePath).catch(() => {});
		throw dbErr;
	}
}

export async function getAsset(relativePath) {
	if (!relativePath) {
		const err = new Error("Asset path required");
		err.status = 404;
		throw err;
	}

	const ext = path.extname(relativePath).toLowerCase();

	if (ext === ".svg") {
		const slug = path.basename(relativePath, ".svg");
		const svg = await kernel.svg.get(slug);

		if (!svg) {
			const err = new Error(`SVG not found: ${slug}`);
			err.status = 404;
			throw err;
		}

		return { data: svg.body, contentType: "image/svg+xml" };
	}

	const contentRoot = path.resolve(config.contentDir);
	const filePath = path.resolve(contentRoot, relativePath);

	// Prevent ../ from escaping contentRoot
	if (!filePath.startsWith(contentRoot + path.sep)) {
		const err = new Error("Forbidden");
		err.status = 403;
		throw err;
	}

	try {
		const data = await readFile(filePath);
		return { data, contentType: MIME_TYPES[ext] || "application/octet-stream" };
	} catch (err) {
		if (err.code === "ENOENT") {
			const notFound = new Error("Asset not found");
			notFound.status = 404;
			throw notFound;
		}
		throw err;
	}
}