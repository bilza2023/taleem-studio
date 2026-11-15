// src/lib/server/modules/mcqResult.js
// MCQ results are stored as "mcq.result" analytics events (meta = full report).

import { db } from "../db.js";
import { fail } from "../access.js";
import { actor, recordEvent } from "./analytics.js";

const MAX_REPORT = 100_000;

const parse = (txt) => {
	try { return txt ? JSON.parse(txt) : null; } catch { return null; }
};

// public — { slug, meta } → { saved: true, id } | { saved: false, reason: "login" }
export async function save(input, ctx) {
	const { slug, meta = null } = input;
	if (meta && JSON.stringify(meta).length > MAX_REPORT) fail(413, "MCQ result too large.");

	const who = actor(ctx);
	if (!who.role) return { saved: false, reason: "login" }; // anonymous: show, don't save

	const item = await db.library.findUnique({
		where: { slug: String(slug ?? "") },
		select: { slug: true, courseSlug: true, type: true }
	});
	if (!item || item.type !== "MCQ") fail(404, `MCQ "${slug}" not found.`);

	const row = await recordEvent("mcq.result", { ...who, slug: item.slug, courseSlug: item.courseSlug, meta });
	return { saved: true, id: row.id };
}

// public (401 inside) — { page?, pageSize? } → my results, each with its full report
export async function mine(input, ctx) {
	const who = actor(ctx);
	if (!who.role) fail(401, "Log in to see your results.");

	const where = { name: "mcq.result", userId: who.userId, role: who.role };
	const size = Math.min(Math.max(Number(input.pageSize) || 20, 1), 100);
	const page = Math.max(Number(input.page) || 1, 1);

	const [rows, total] = await Promise.all([
		db.analyticsEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * size, take: size }),
		db.analyticsEvent.count({ where })
	]);

	const slugs = [...new Set(rows.map((r) => r.slug).filter(Boolean))];
	const libs = await db.library.findMany({ where: { slug: { in: slugs } }, select: { slug: true, title: true } });
	const titles = new Map(libs.map((l) => [l.slug, l.title]));

	return {
		items: rows.map((r) => ({
			id: r.id,
			slug: r.slug,
			title: titles.get(r.slug) ?? r.slug,
			createdAt: r.createdAt,
			report: parse(r.meta)
		})),
		total,
		page,
		pageSize: size,
		pages: Math.max(1, Math.ceil(total / size))
	};
}