// src/lib/timings/buildTapList.js

// An item can take a time if it is a plain object.
// Table rows are arrays, so they are skipped.
export function isTimedItem(item) {
	return item !== null && typeof item === "object" && !Array.isArray(item);
}

// Flatten the deck into its tap targets, in order.
// A slide with no timed items gets one target for the slide itself (item: null).
export function buildTapList(deck) {
	const list = [];

	deck.deck.forEach((slide, s) => {
		const data = Array.isArray(slide.data) ? slide.data : [];
		const timed = [];

		data.forEach((item, i) => {
			if (isTimedItem(item)) timed.push(i);
		});

		if (timed.length === 0) list.push({ slide: s, item: null });
		else timed.forEach((i) => list.push({ slide: s, item: i }));
	});

	return list;
}

// Enters needed: the first target is covered by pressing Record.
export function tapsNeeded(deck) {
	return Math.max(0, buildTapList(deck).length - 1);
}