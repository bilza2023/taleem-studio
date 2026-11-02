// /src/lib/utils/player-utils/getTimer.js
import { createAudioTimer } from "./createAudioTimer.js";
import { createSilentTimer } from "./createSilentTimer.js";

export async function getTimer(audioUrl, Howl, format) {
	if (!audioUrl) return createSilentTimer();
	return createAudioTimer({ url: audioUrl, Howl, format });
}