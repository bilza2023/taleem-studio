// src/lib/timings/saveDeck.js
// deck → validated + saved (body only). Returns the saved deck, or throws with the reason.
// audio is written exactly as it is in the deck — this never sets it.

import { send } from "$lib/send";
import { finalizeDeckV2 } from "$lib/editor/js/finalizeDeckV2.js";

export async function saveDeck(slug, deck) {
	// Same gate as the Editor
	const r = finalizeDeckV2(deck);
	if (!r.ok) {
		const err = r.errors?.[0];
		throw new Error(
			`${r.stage}: ${err?.path ? `${err.path} — ` : ""}${err?.message ?? "invalid deck"}`
		);
	}

	await send("adminLibrary", "update", {
		slug,
		data: { body: JSON.stringify(r.presentation) }
	});

	return r.presentation;
}