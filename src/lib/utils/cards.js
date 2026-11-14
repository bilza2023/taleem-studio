// src/lib/utils/cards.js
// Shared by HomeLinks, hub and any other place that shows deck cards.
import { config } from "$lib/config.js";

export function getPlayHref(card) {
	const slug = encodeURIComponent(card.slug);
	switch (card.type) {
		case "ARTICLE": return `${config.basePath}/articles?article=${slug}`;
		case "PLAYER":  return `${config.basePath}/player?lesson=${slug}`;
		case "MCQ":     return `${config.basePath}/mcq?mcq=${slug}`;
		default:        return "#";
	}
}

// "Fbise8math Ch12 Histogram" → "Ch12 Histogram" (course is shown elsewhere)
export function displayTitle(card) {
	const title = card.title ?? card.slug;
	if (!card.courseSlug) return title;
	const prefix = card.courseSlug.toLowerCase() + " ";
	return title.toLowerCase().startsWith(prefix) ? title.slice(prefix.length) : title;
}

export function timeAgo(date) {
	if (!date) return "";
	const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
	if (days <= 0) return "today";
	if (days === 1) return "yesterday";
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
	return new Date(date).toLocaleDateString();
}