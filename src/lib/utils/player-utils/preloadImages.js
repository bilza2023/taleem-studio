// /src/lib/utils/player-utils/preloadImages.js
// Downloads all images in parallel. Returns Map(originalUrl → blobUrl).
// strict: true  → any failure rejects (all created blob URLs are revoked)
// strict: false → failures are logged; those images keep their original URL

const SVG_TYPE = "image/svg+xml";

function isSvg(url) {
	return url.split(/[?#]/)[0].toLowerCase().endsWith(".svg");
}

async function fetchImage(url, signal) {
	const res = await fetch(url, { signal });
	if (!res.ok) throw new Error(`Image download failed (${res.status}): ${url}`);

	let blob = await res.blob();

	// <img> refuses to render an SVG blob without the right type
	if (isSvg(url) && blob.type !== SVG_TYPE) {
		blob = new Blob([blob], { type: SVG_TYPE });
	}

	return URL.createObjectURL(blob);
}

export function revokeImageMap(map) {
	for (const blobUrl of map.values()) URL.revokeObjectURL(blobUrl);
	map.clear();
}

export async function preloadImages(urls, { signal, strict = false, onProgress } = {}) {
	const map = new Map();
	const total = urls.length;
	let done = 0;

	onProgress?.(0, total);

	const results = await Promise.allSettled(
		urls.map(async (url) => {
			try {
				map.set(url, await fetchImage(url, signal));
			} finally {
				done++;
				onProgress?.(done, total);
			}
		})
	);

	const failed = urls.filter((_, i) => results[i].status === "rejected");

	if (signal?.aborted) {
		revokeImageMap(map);
		throw signal.reason ?? new DOMException("Aborted", "AbortError");
	}

	if (failed.length && strict) {
		revokeImageMap(map);
		throw new Error(`Missing images:\n${failed.join("\n")}`);
	}

	for (const url of failed) console.warn(`[player] image not preloaded: ${url}`);

	return map;
}