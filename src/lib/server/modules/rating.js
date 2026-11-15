// src/lib/server/modules/rating.js
// Deck grades: one rating per student per deck; re-rating updates the row.

import { db } from "../db.js";
import { fail } from "../access.js";

// the option vocabulary — edit here, nowhere else
export const RATING_OPTIONS = [
	{ key: "wasClear", label: "Was clear" },
	{ key: "hasErrors", label: "Has errors" },
	{ key: "moreDetails", label: "More details required" }
];
const OPTION_KEYS = new Set(RATING_OPTIONS.map((o) => o.key));
const COMMENT_MAX = 300;

const str = (v) => (typeof v === "string" ? v.trim() : "");
const parse = (s) => { try { return JSON.parse(s ?? "[]"); } catch { return []; } };
const shape = (r) => (r ? { ...r, options: parse(r.options) } : null);

// ── data (used by hub) ────────────────────────────────────

// { slug: stars } for a list of decks
export async function starsForSlugs(userId, slugs = []) {
	if (!slugs.length) return {};
	const rows = await db.rating.findMany({
		where: { userId, librarySlug: { in: slugs } },
		select: { librarySlug: true, stars: true }
	});
	return Object.fromEntries(rows.map((r) => [r.librarySlug, r.stars]));
}

// ── api ───────────────────────────────────────────────────

// public — {} → option list
export async function options() {
	return RATING_OPTIONS;
}

// student — { librarySlug, stars, options?, comment? } → rating
export async function save(input, ctx) {
	const stars = Number(input.stars);
	if (!Number.isInteger(stars) || stars < 1 || stars > 5) fail(400, "stars must be 1–5.");

	// course comes from the deck, never from the client; published decks only
	const deck = await db.library.findUnique({ where: { slug: str(input.librarySlug) } });
	if (!deck || deck.status !== "PUBLISHED") fail(404, "Lesson not found.");
	if (deck.allowCommunication === false) fail(403, "Rating is turned off for this lesson.");

	const options = (Array.isArray(input.options) ? input.options : []).filter((k) => OPTION_KEYS.has(k));
	const comment = String(input.comment ?? "").slice(0, COMMENT_MAX).trim() || null;

	const data = { stars, options: JSON.stringify(options), comment };
	const row = await db.rating.upsert({
		where: { userId_librarySlug: { userId: ctx.user.id, librarySlug: deck.slug } },
		create: { userId: ctx.user.id, librarySlug: deck.slug, courseSlug: deck.courseSlug, ...data },
		update: data
	});
	return shape(row);
}

// student — { librarySlug } → my rating or null
export async function mine(input, ctx) {
	return shape(await db.rating.findUnique({
		where: { userId_librarySlug: { userId: ctx.user.id, librarySlug: str(input.librarySlug) } }
	}));
}

// teacher of courseSlug — { courseSlug, librarySlug? }
//   with librarySlug → one deck: average, count, star spread, option counts
//   without        → every deck in the course: average + count
export async function summary(input) {
	const courseSlug = str(input.courseSlug);
	const librarySlug = str(input.librarySlug);

	if (!librarySlug) {
		const rows = await db.rating.groupBy({
			by: ["librarySlug"],
			where: { courseSlug },
			_avg: { stars: true },
			_count: { _all: true }
		});
		return rows.map((r) => ({
			librarySlug: r.librarySlug,
			average: Math.round((r._avg.stars ?? 0) * 10) / 10,
			count: r._count._all
		}));
	}

	const deck = await db.library.findUnique({ where: { slug: librarySlug }, select: { slug: true, courseSlug: true } });
	if (!deck || deck.courseSlug !== courseSlug) fail(404, "Lesson not found in this course.");

	const rows = await db.rating.findMany({ where: { librarySlug }, select: { stars: true, options: true } });
	const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	const options = {};
	let total = 0;
	for (const r of rows) {
		stars[r.stars] += 1;
		total += r.stars;
		for (const o of parse(r.options)) options[o] = (options[o] ?? 0) + 1;
	}
	return {
		librarySlug,
		count: rows.length,
		average: rows.length ? Math.round((total / rows.length) * 10) / 10 : null,
		stars,
		options
	};
}

// teacher of courseSlug — { courseSlug, librarySlug?, withComment?, page?, pageSize? } → page of ratings
export async function list(input) {
	const where = { courseSlug: str(input.courseSlug) };
	if (str(input.librarySlug)) where.librarySlug = str(input.librarySlug);
	if (input.withComment) where.comment = { not: null };

	const size = Math.min(Math.max(Number(input.pageSize) || 20, 1), 100);
	const page = Math.max(Number(input.page) || 1, 1);

	const [items, total] = await Promise.all([
		db.rating.findMany({
			where,
			orderBy: { updatedAt: "desc" },
			skip: (page - 1) * size,
			take: size,
			include: { user: { select: { id: true, email: true, name: true } } }
		}),
		db.rating.count({ where })
	]);

	return { items: items.map(shape), total, page, pageSize: size, pages: Math.max(1, Math.ceil(total / size)) };
}