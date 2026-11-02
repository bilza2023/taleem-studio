// /src/lib/utils/player-utils/mapDeckAssets.js
// Walks every image location in a deck and replaces each src with fn(src).
// This is the ONLY place that knows where images live.
// New image location in a template → add it here, nowhere else.

import { ContentType, EqSidePanelType } from "$lib/taleem-specs/enums";

export function mapDeckAssets(deck, fn) {
	if (!deck) return deck;

	// background
	if (deck.background?.backgroundImage) {
		deck.background.backgroundImage = fn(deck.background.backgroundImage);
	}

	for (const slide of deck.deck ?? []) {
		for (const item of slide.data ?? []) {

			// image components (ImageSlide, FillImage, ImageLeftBulletsRight, …)
			if (item?.name === ContentType.IMAGE) {
				item.content = fn(item.content);
			}

			// EQ side-panel images
			if (Array.isArray(item?.spItems)) {
				for (const spItem of item.spItems) {
					if (spItem?.type === EqSidePanelType.IMAGE) {
						spItem.content = fn(spItem.content);
					}
				}
			}
		}
	}

	return deck;
}