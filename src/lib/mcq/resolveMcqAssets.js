// /src/lib/mcq/resolveMcqAssets.js
import { resolveAssetPaths } from "$lib/utils/player-utils/resolveAssetPaths.js";

export const MCQ_ASSET_BASE = "/content/images/";

/**
 * MCQ JSON stores bare file names. Resolve background + every slide in ONE
 * deck-shaped call (so mapDeckAssets sees a normal deck), then put the
 * resolved slides back on their questions.
 *
 * → { background, questions }
 */
export function resolveMcqAssets(mcq, assetBase = MCQ_ASSET_BASE) {
	const refs = mcq.questions.flatMap((q) =>
		Object.entries(q.slides).map(([key, slide]) => ({ qid: q.id, key, slide }))
	);

	const resolved = resolveAssetPaths(
		{ background: mcq.background, deck: refs.map((r) => r.slide) },
		assetBase
	);

	const slidesByQ = {};
	refs.forEach((r, i) => {
		(slidesByQ[r.qid] ??= {})[r.key] = resolved.deck[i];
	});

	return {
		background: resolved.background,
		questions: mcq.questions.map((q) => ({ ...q, slides: slidesByQ[q.id] ?? {} }))
	};
}