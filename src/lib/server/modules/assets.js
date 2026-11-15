// src/lib/server/modules/assets.js

import { db } from "../db.js";
import { str, shape } from "./_asset.js";

// admin — { search? } → [{ type, slug, title, tags }] across image / audio / svg (no svg body)
export async function list(input) {
	const search = str(input.search);
	const where = search ? { OR: [{ slug: { contains: search } }, { title: { contains: search } }] } : {};
	const select = { slug: true, title: true, tags: true, createdAt: true };

	const [images, audio, svgs] = await Promise.all([
		db.image.findMany({ where, select, orderBy: { createdAt: "desc" } }),
		db.audio.findMany({ where, select, orderBy: { createdAt: "desc" } }),
		db.svg.findMany({ where, select, orderBy: { createdAt: "desc" } })
	]);

	return [
		...images.map((r) => ({ type: "image", ...shape(r) })),
		...audio.map((r) => ({ type: "audio", ...shape(r) })),
		...svgs.map((r) => ({ type: "svg", ...shape(r) }))
	];
}