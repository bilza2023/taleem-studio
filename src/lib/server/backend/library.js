// /home/bilal-tariq/00--TALEEM/taleem/src/lib/server/backend/library.js

import kernel from "../../taleem-kernel";

const VALID_TYPES = ["ARTICLE", "PLAYER"];

export async function createLibrary(data) {
	if (!VALID_TYPES.includes(data.type)) {
		const err = new Error(`Invalid type: ${data.type}`);
		err.status = 400;
		throw err;
	}

	return kernel.library.create(data);
}

export async function getLibrary(slug, options = {}) {
	const { includeUnpublished = false } = options;

	return kernel.library.get(slug, { includeUnpublished });
}

const PLACEHOLDER_AUDIO = ["music.mp3", "music.opus"];

function withFlags(item) {
	const { body, narration, ...rest } = item;

	let hasDeck = false;
	let hasAudio = false;

	if (body?.trim()) {
		try {
			const p = JSON.parse(body);
			hasDeck = Array.isArray(p?.deck) && p.deck.length > 0;
			hasAudio = !!p?.audio && !PLACEHOLDER_AUDIO.includes(p.audio);
		} catch {}
	}

	return {
		...rest,
		hasDeck,
		hasAudio,
		hasNarration: !!narration?.trim()
	};
}

export async function listLibrary(filters, options = {}) {
	const { includeUnpublished = false } = options;

	if (!includeUnpublished) {
		return kernel.library.list(filters, { includeUnpublished });
	}

	// admin list: fetch content, send only flags
	const items = await kernel.library.list(filters, { includeUnpublished, includeContent: true });
	return items.map(withFlags);
}

export async function updateLibrary(slug, data) {
	const existing = await kernel.library.get(slug, { includeUnpublished: true });

	if (!existing) {
		const err = new Error(`Library item "${slug}" not found.`);
		err.status = 404;
		throw err;
	}

	return kernel.library.update(slug, data);
}

export async function deleteLibrary(slug) {
	const existing = await kernel.library.get(slug, { includeUnpublished: true });

	if (!existing) {
		const err = new Error(`Library item "${slug}" not found.`);
		err.status = 404;
		throw err;
	}

	return kernel.library.delete(slug);
}

export async function listLibraryByGroup(courseSlug, groupSlug, options = {}) {
	const { includeUnpublished = false } = options;

	return kernel.library.listByGroup(courseSlug, groupSlug, { includeUnpublished });
}