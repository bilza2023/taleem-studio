// src/lib/server/backend/rating.js
import kernel from "../../taleem-kernel";
import { requireStudent, requireAdmin, assertCourse, fail } from "./guards.js";

// the option vocabulary — edit here, nowhere else
export const RATING_OPTIONS = [
	{ key: "wasClear",     label: "Was clear" },
	{ key: "hasErrors",    label: "Has errors" },
	{ key: "moreDetails",  label: "More details required" }
];
const OPTION_KEYS = new Set(RATING_OPTIONS.map((o) => o.key));
const COMMENT_MAX = 300;

export async function saveRating(data, token) {
	const user = await requireStudent(token);

	// course comes from the deck, never from the client; published decks only
	const deck = await kernel.library.get(data.librarySlug);
	if (!deck) throw fail("Lesson not found.", 404);

	const options = (Array.isArray(data.options) ? data.options : []).filter((k) => OPTION_KEYS.has(k));
	const comment = (data.comment ?? "").toString().slice(0, COMMENT_MAX);

	return kernel.rating.save({
		userId: user.id,
		librarySlug: deck.slug,
		courseSlug: deck.courseSlug,
		stars: data.stars,
		options,
		comment
	});
}

export async function getMyRating(data, token) {
	const user = await requireStudent(token);
	return kernel.rating.getMine(user.id, data.librarySlug);
}

export function getRatingOptions() {
	return RATING_OPTIONS;
}

// ── admin ────────────────────────────────────────────────
export async function ratingSummary(data, token) {
	const admin = await requireAdmin(token);
	const deck = await kernel.library.get(data.librarySlug, { includeUnpublished: true });
	if (!deck) throw fail("Lesson not found.", 404);
	assertCourse(admin, deck.courseSlug);
	return kernel.rating.summary(deck.slug);
}

export async function ratingSummaryByCourse(data, token) {
	const admin = await requireAdmin(token);
	assertCourse(admin, data.courseSlug);
	return kernel.rating.summaryByCourse(data.courseSlug);
}

export async function listRatings(data, token) {
	const admin = await requireAdmin(token);
	assertCourse(admin, data.courseSlug);
	return kernel.rating.listPage(
		{ courseSlug: data.courseSlug, librarySlug: data.librarySlug, withComment: !!data.withComment },
		{ page: data.page, pageSize: data.pageSize }
	);
}