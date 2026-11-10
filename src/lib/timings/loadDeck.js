// src/lib/timings/loadDeck.js
// slug → { item, deck } or a clear error

import { send } from "$lib/send";
import { patchDeckV2 } from "$lib/editor/js/patchDeckV2.js";

export async function loadDeck(slug) {
	if (!slug) throw new Error("No slug in URL (?slug=...)");

	const item = await send("adminLibrary", "get", { slug });
	if (!item) throw new Error(`"${slug}" not found`);
	if (item.type !== "PLAYER") throw new Error(`"${slug}" is a ${item.type}, not a Player.`);
	if (!item.body?.trim()) throw new Error(`"${slug}" has no deck yet — build it in the Editor first.`);

	const deck = patchDeckV2(JSON.parse(item.body));
	if (!deck.deck.length) throw new Error(`"${slug}" has no slides.`);

	return { item, deck };
}