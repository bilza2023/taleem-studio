// src/lib/server/modules/svg.js
import { db } from "../db.js";
import { fail } from "../access.js";
import { makeAssetHandlers, str, shape } from "./_asset.js";

// decided rule: svg slugs ARE filenames and always end in .svg
function svgSlug(slug) {
	if (!/^[a-z0-9][a-z0-9._-]*\.svg$/i.test(slug)) fail(400, `"${slug}" is not a valid svg slug (must end in .svg).`);
}

export const { get, list, create, update, remove } = makeAssetHandlers("svg", { hasBody: true, slugRule: svgSlug });

// admin — { slugs: [...] } → created rows. All or nothing.
export async function bulkCreate(input) {
	const slugs = Array.isArray(input.slugs) ? input.slugs.map(str) : null;
	if (!slugs || !slugs.length) fail(400, "slugs must be a non-empty array.");
	if (new Set(slugs).size !== slugs.length) fail(400, "slugs contains duplicates.");
	slugs.forEach(svgSlug); // 400 before anything is written

	const existing = await db.svg.findMany({ where: { slug: { in: slugs } }, select: { slug: true } });
	if (existing.length) fail(409, `Already exist: ${existing.map((e) => e.slug).join(", ")}`);

	const rows = await db.$transaction(
		slugs.map((slug) =>
			db.svg.create({ data: { slug, title: slug.replace(/\.svg$/i, "").replace(/-/g, " "), body: "", tags: "[]" } })
		)
	);
	return rows.map(shape);
}