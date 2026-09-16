// /home/bilal-tariq/00--TALEEM/taleem/src/lib/taleemUI/js/taleemUi.svelte.js

import { prepareDeck } from "$lib/taleem-player/js/prepareDeck.js";

export function createPlayerState() {

	let presentation  = $state(null);
	let currentTime   = $state(0);
	let PLAYER_WIDTH  = $state(0);
	let PLAYER_HEIGHT = $state(0);
	let deckEndTime   = $state(0);
	let isPlaying     = $state(false);

	let timer  = null; // not reactive on purpose — internal object, not UI state
	let ticker = null;

	function play() {
		if (isPlaying) return;
		timer?.play();
		isPlaying = true;
	}

	function pause() {
		timer?.pause();
		isPlaying = false;
	}

	function stop() {
		timer?.pause();
		timer?.seek(0);
		currentTime = 0;
		isPlaying = false;
	}

	function seek(time) {
		timer?.seek(time);
		currentTime = time;
	}

	function togglePlay() {
		if (isPlaying) pause();
		else play();
	}

	function startTicker() {
		if (ticker) return;

		ticker = setInterval(() => {
			if (!timer) return;

			currentTime = timer.now();

			if (currentTime >= deckEndTime) {
				timer.pause();
				currentTime = deckEndTime - 0.001;
			}
		}, 50);
	}

	function stopTicker() {
		if (ticker) {
			clearInterval(ticker);
			ticker = null;
		}
	}

	// caller passes already-fetched deck (namespace differs per route,
	// so fetching itself stays out of this file) + a timer factory
	// (createAudioTimer vs createSilentTimer)
	async function load(deck, ASSET_BASE, makeTimer) {
		const prepared = prepareDeck(deck, ASSET_BASE);

		presentation = prepared.deck;
		deckEndTime  = prepared.deckEndTime;
		timer        = await makeTimer(prepared.audioFileName);
	}

	function setSize(width, height) {
		PLAYER_WIDTH  = width;
		PLAYER_HEIGHT = height;
	}

	function destroy() {
		stopTicker();
		timer?.pause?.();
	}

	return {
		get presentation()  { return presentation; },
		get currentTime()   { return currentTime; },
		get PLAYER_WIDTH()  { return PLAYER_WIDTH; },
		get PLAYER_HEIGHT() { return PLAYER_HEIGHT; },
		get deckEndTime()   { return deckEndTime; },
		get isPlaying()     { return isPlaying; },

		play, pause, stop, seek, togglePlay,
		startTicker, stopTicker,
		load, setSize, destroy
	};
}