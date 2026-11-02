// /src/lib/utils/player-utils/loadLesson.js
// raw deck in → { deck, timer, destroy } out. Everything downloaded before return.

import { Howl } from "howler";
import { config } from "$lib/config.js";
import { mapDeckAssets } from "./mapDeckAssets.js";
import { resolveAssetPaths } from "./resolveAssetPaths.js";
import { getAudioFileName } from "./getAudioFileName.js";
import { preloadAudio } from "./preloadAudio.js";
import { preloadImages, revokeImageMap } from "./preloadImages.js";
import { getTimer } from "./getTimer.js";

const DEFAULT_IMAGE_BASE = `${config.basePath}/content/images/`;
const DEFAULT_AUDIO_BASE = `${config.basePath}/content/audio/`;

// Only same-origin files are preloaded; external / data: / blob: are left as-is
function isPreloadable(src) {
	if (!src || typeof src !== "string") return false;
	if (src.startsWith("data:") || src.startsWith("blob:")) return false;
	try {
		return new URL(src, location.href).origin === location.origin;
	} catch {
		return false;
	}
}

function collectImageUrls(deck) {
	const urls = new Set();
	mapDeckAssets(deck, (src) => {
		if (isPreloadable(src)) urls.add(src);
		return src;
	});
	return [...urls];
}

function getFormat(fileName) {
	return fileName?.split(".").pop()?.toLowerCase() || undefined;
}

export async function loadLesson(rawDeck, {
	imageBase = DEFAULT_IMAGE_BASE,
	audioBase = DEFAULT_AUDIO_BASE,
	strict = false,
	signal,
	onProgress
} = {}) {

	// never mutate the caller's deck
	const deck = structuredClone(rawDeck);

	resolveAssetPaths(deck, imageBase);

	const audioFileName = getAudioFileName(deck);
	const audioUrl = audioFileName ? audioBase + audioFileName : null;
	const imageUrls = collectImageUrls(deck);

	const progress = {
		audio: { loaded: 0, total: 0 },
		images: { done: 0, total: imageUrls.length }
	};
	const report = () => onProgress?.({
		audio: { ...progress.audio },
		images: { ...progress.images }
	});
	report();

	// ---- download audio + images in parallel ----
	const [audioRes, imagesRes] = await Promise.allSettled([
		audioUrl
			? preloadAudio(audioUrl, {
				signal,
				onProgress: (loaded, total) => {
					progress.audio = { loaded, total };
					report();
				}
			})
			: Promise.resolve(null),

		preloadImages(imageUrls, {
			signal,
			strict,
			onProgress: (done, total) => {
				progress.images = { done, total };
				report();
			}
		})
	]);

	const audioBlobUrl = audioRes.status === "fulfilled" ? audioRes.value : null;
	const imageMap = imagesRes.status === "fulfilled" ? imagesRes.value : new Map();

	const revokeAll = () => {
		if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl);
		revokeImageMap(imageMap);
	};

	if (audioRes.status === "rejected" || imagesRes.status === "rejected") {
		revokeAll();
		throw audioRes.status === "rejected" ? audioRes.reason : imagesRes.reason;
	}

	// ---- point the deck at local copies ----
	mapDeckAssets(deck, (src) => imageMap.get(src) ?? src);

	// ---- timer ----
	let timer;
	try {
		timer = await getTimer(audioBlobUrl, Howl, getFormat(audioFileName));
	} catch (error) {
		revokeAll();
		throw error;
	}

	if (signal?.aborted) {
		timer.destroy();
		revokeAll();
		throw signal.reason ?? new DOMException("Aborted", "AbortError");
	}

	let destroyed = false;

	return {
		deck,
		timer,
		destroy() {
			if (destroyed) return;
			destroyed = true;
			timer.destroy();
			revokeAll();
		}
	};
}