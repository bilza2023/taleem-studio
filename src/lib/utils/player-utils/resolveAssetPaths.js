// /src/lib/utils/player-utils/resolveAssetPaths.js
import { mapDeckAssets } from "./mapDeckAssets.js";

export function resolveAssetPaths(deck, ASSET_BASE) {
	if (!deck) return deck;

	const assetBase = ASSET_BASE.endsWith("/") ? ASSET_BASE : `${ASSET_BASE}/`;

	function resolvePath(src) {
		if (!src || typeof src !== "string") return src;

		if (
			src.startsWith("http://") ||
			src.startsWith("https://") ||
			src.startsWith("data:") ||
			src.startsWith("blob:")
		) return src;

		if (src.startsWith(assetBase) || src.startsWith("/content/")) return src;

		if (src.startsWith("/images/")) return assetBase + src.slice("/images/".length);

		if (src.startsWith("/")) return assetBase + src.slice(1);

		return assetBase + src;
	}

	return mapDeckAssets(deck, resolvePath);
}