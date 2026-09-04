
///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/content/[...path]/+server.js
import { error } from "@sveltejs/kit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "$lib/config.js";
import { getSvg } from "$lib/server/backend/svg.js";

const CONTENT_DIR = config.contentDir;

const TYPES = {
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

export async function GET({ params }) {
	const relativePath = params.path;

	if (!relativePath) {
		throw error(404, "File not found");
	}

	const ext = path.extname(relativePath).toLowerCase();

		if (ext === ".svg") {
		const filename = path.basename(relativePath);
		const bareSlug = path.basename(relativePath, ".svg");

		let svg = await getSvg(filename);

		if (!svg) {
			svg = await getSvg(bareSlug);
		}

		if (!svg) {
			throw error(404, "SVG not found");
		}

		return new Response(svg.body, {
			headers: {
				"Content-Type": "image/svg+xml",
				"Cache-Control": "no-cache"
			}
		});
	}

	const contentRoot = path.resolve(CONTENT_DIR);
	const filePath = path.resolve(contentRoot, relativePath);

	// Prevent ../ from escaping content/
	if (!filePath.startsWith(contentRoot + path.sep)) {
		throw error(403, "Forbidden");
	}

	try {
		const data = await readFile(filePath);

		return new Response(data, {
			headers: {
				"Content-Type": TYPES[ext] || "application/octet-stream",
				"Cache-Control": "no-cache"
			}
		});
	} catch {
		throw error(404, "File not found");
	}
}