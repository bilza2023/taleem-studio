// src/lib/server/modules/_asset.js
// One implementation for the three global asset tables (image / audio / svg).
// Read public, create/update any admin, delete super (api.js).

import { db } from "../db.js";
import { fail } from "../access.js";

export function str(v) {
	return typeof v === "string" ? v.trim() : "";
}

function parseList(s) {
	try {
		const v = JSON.parse(s ?? "[]");
		return Array.isArray(v) ? v : [];
	} catch {
		return [];
	}
}

function tagList(v) {
	if (!Array.isArray(v) || !v.every((t) => typeof t === "string" && t.trim())) {
		fail(400, "tags must be an array of strings.");
	}
	return JSON.stringify([...new Set(v.map((t) => t.trim()))]);
}

export const shape = (row) => (row ? { ...row, tags: parseList(row.tags) } : null);

// model: "image" | "audio" | "svg"
// hasBody: svg stores markup in `body`; slugRule validates the slug on create; onRemove deletes the file on disk
export function makeAssetHandlers(model, { hasBody = false, slugRule = null, onRemove = null } = {}) {
	const table = db[model];

	async function mustExist(slug) {
		const row = await table.findUnique({ where: { slug } });
		if (!row) fail(404, `${model} "${slug}" not found.`);
		return row;
	}

	function fields(src) {
		const data = {};
		if (src.title !== undefined) {
			if (!str(src.title)) fail(400, "title cannot be empty.");
			data.title = str(src.title);
		}
		if (src.tags !== undefined) data.tags = tagList(src.tags);
		if (hasBody && src.body !== undefined) {
			if (typeof src.body !== "string") fail(400, "body must be text.");
			data.body = src.body;
		}
		return data;
	}

	return {
		// public — { slug } → asset
		async get(input) {
			return shape(await mustExist(str(input.slug)));
		},

		// public — { search?, page?, pageSize?, full? } → { items, total, page, pageSize, pages }
		// svg body is left out unless full: true (lists can be large)
		async list(input) {
			const search = str(input.search);
			const where = search
				? { OR: [{ slug: { contains: search } }, { title: { contains: search } }] }
				: {};
			const size = Math.min(Math.max(Number(input.pageSize) || 50, 1), 200);
			const page = Math.max(Number(input.page) || 1, 1);

			const LIGHT = { slug: true, title: true, tags: true, createdAt: true, updatedAt: true };
			const select = hasBody && !input.full ? { select: LIGHT } : {};

			const [rows, total] = await Promise.all([
				table.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * size, take: size, ...select }),
				table.count({ where })
			]);

			return { items: rows.map(shape), total, page, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
		},

		// admin — { slug, title?, tags?, body? } → asset
		async create(input) {
			const slug = str(input.slug);
			if (!slug) fail(400, "slug is required.");
			if (slugRule) slugRule(slug);

			const data = { slug, title: str(input.title) || slug, ...fields(input) };
			if (hasBody && data.body === undefined) data.body = ""; // svg.body is required in the schema

			try {
				return shape(await table.create({ data }));
			} catch (err) {
				if (err.code === "P2002") fail(409, `${model} "${slug}" already exists.`);
				throw err;
			}
		},

		// admin — { slug, changes } → asset
		async update(input) {
			const slug = str(input.slug);
			await mustExist(slug);
			const data = fields(input.changes ?? {});
			if (!Object.keys(data).length) fail(400, "Nothing to update.");
			return shape(await table.update({ where: { slug }, data }));
		},

		// super — { slug } → ok. Row first: a failed file delete leaves only a harmless orphan file.
		async remove(input) {
			const slug = str(input.slug);
			await mustExist(slug);
			await table.delete({ where: { slug } });
			if (onRemove) await onRemove(slug);
			return { ok: true };
		}
	};
}