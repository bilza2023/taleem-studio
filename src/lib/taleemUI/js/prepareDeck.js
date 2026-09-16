// /src/routes/player/js/prepareDeck.js
import { getDeckEndTime } from "./getDeckEndTime.js";
import { getAudioFileName } from "./getAudioFileName.js";
import { resolveAssetPaths } from "./resolveAssetPaths.js";

export function prepareDeck(deck,ASSET_BASE,AUDIO_BASE) {

	if (!deck) return null;

	resolveAssetPaths(
		deck,
		ASSET_BASE
	);

	const rawAudioFileName = getAudioFileName(deck);

	return {

		deck,

		deckEndTime:
			getDeckEndTime(deck),

		audioFileName:
			rawAudioFileName
				? `${AUDIO_BASE}${rawAudioFileName}`
				: null

	};

}