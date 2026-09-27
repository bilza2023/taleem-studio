// src/routes/admin/edit/content/js/bundleDeck.js

import { config } from "$lib/config.js";

/**
 * Find every SVG filename referenced anywhere in the deck.
 * Walks the whole object, so no slide type or field name is hardcoded.
 * Returns unique bare filenames in order of first appearance.
 */
export function findDeckSvgs(deck) {
	const svgs = new Set();

	function walk(node) {
		if (node == null) return;

		if (typeof node === "string") {
			const v = node.trim();
			if (!v || v.startsWith("data:") || /^https?:\/\//i.test(v)) return;

			const name = v.split(/[?#]/)[0].split("/").pop();
			if (name.toLowerCase().endsWith(".svg")) svgs.add(name);
			return;
		}

		if (Array.isArray(node)) {
			node.forEach(walk);
			return;
		}

		if (typeof node === "object") {
			Object.values(node).forEach(walk);
		}
	}

	walk(deck);
	return Array.from(svgs);
}

/**
 * Bundle a deck with the text of every SVG it references.
 */
export async function bundleDeck(deck) {
	const base = `${config.basePath}/content/images/`;
	const names = findDeckSvgs(deck);

	const results = await Promise.all(
		names.map(async name => {
			try {
				const res = await fetch(base + encodeURIComponent(name));
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return { name, content: await res.text() };
			} catch {
				return { name, missing: true };
			}
		})
	);

	return {
		deck,
		svgs: results.filter(r => !r.missing),
		missing: results.filter(r => r.missing).map(r => r.name)
	};
}

/**
 * Trigger a browser download of `data` as pretty-printed JSON.
 */
export function downloadJSON(data, fileName) {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json"
	});
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	a.click();

	URL.revokeObjectURL(url);
}