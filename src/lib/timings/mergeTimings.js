// src/lib/timings/mergeTimings.js

import { buildTapList } from "./buildTapList.js";

const round = (t) => Math.round(t * 10) / 10;

function fail(message) {
	return { ok: false, error: message };
}

// taps: seconds from recording start, one per Enter (in order)
// duration: total recording length in seconds
export function mergeTimings(deck, taps, duration) {
	const targets = buildTapList(deck);
	if (targets.length === 0) return fail("Deck has no slides");

	const needed = targets.length - 1;
	if (taps.length < needed) {
		return fail(`Not enough taps: ${taps.length} of ${needed}`);
	}

	// Target 0 = recording start; extra taps are ignored.
	const times = [0, ...taps.slice(0, needed).map(round)];
	const end = round(duration);

	if (end <= times[times.length - 1]) {
		return fail("Recording ended before the last tap");
	}

	const out = structuredClone(deck);
	const slides = out.deck;

	targets.forEach((t, k) => {
		const slide = slides[t.slide];
		const isFirstOfSlide = k === 0 || targets[k - 1].slide !== t.slide;

		if (isFirstOfSlide) slide.start = times[k];
		if (t.item !== null) slide.data[t.item].showAt = times[k];
	});

	for (let s = 0; s < slides.length; s++) {
		slides[s].end = s < slides.length - 1 ? slides[s + 1].start : end;

		if (slides[s].start >= slides[s].end) {
			return fail(`Slide ${s + 1} has zero length (taps too close)`);
		}
	}

	return { ok: true, deck: out };
}