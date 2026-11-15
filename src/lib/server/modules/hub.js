// src/lib/server/modules/hub.js
// The student's home: courses, continue/start, new items, messages, announcements.

import { db } from "../db.js";
import { activeCourses } from "./subscription.js";
import { cardsBySlugs, nextInGroup, firstInCourse } from "./library.js";
import { starsForSlugs } from "./rating.js";
import { listForUser, unreadReplies } from "./inquiry.js";
import { forStudent } from "./notification.js";
import { trackEvent } from "./analytics.js";

const RECENT_LIMIT = 10;
const LIST_LIMIT = 5;
const NEW_LIMIT = 20;
const FIRST_VISIT_DAYS = 14; // no last visit yet → show the last 2 weeks

// last distinct lessons a student opened, newest first
async function recentLessons(userId, limit) {
	const rows = await db.analyticsEvent.groupBy({
		by: ["slug", "courseSlug"],
		where: { name: "lesson.open", role: "student", userId, slug: { not: null } },
		_max: { createdAt: true },
		orderBy: { _max: { createdAt: "desc" } },
		take: limit
	});
	return rows.map((r) => ({ slug: r.slug, courseSlug: r.courseSlug, lastOpenedAt: r._max.createdAt }));
}

async function lastVisit(userId) {
	const e = await db.analyticsEvent.findFirst({
		where: { name: "hub.open", userId, role: "student" },
		orderBy: { createdAt: "desc" }
	});
	return e?.createdAt ?? null;
}

async function recentPublishes(courseSlugs, since, limit) {
	if (!courseSlugs.length) return [];
	return db.analyticsEvent.findMany({
		where: { name: "lesson.publish", courseSlug: { in: courseSlugs }, createdAt: { gt: since } },
		orderBy: { createdAt: "desc" },
		take: limit
	});
}

// student — {} → hub
export async function get(input, ctx) {
	const user = ctx.user;

	const [subscribed, recent, lastVisitAt] = await Promise.all([
		activeCourses(user.id),
		recentLessons(user.id, RECENT_LIMIT),
		lastVisit(user.id)
	]);

	// your courses = active subscriptions + courses with watch history
	const courseSlugs = [...new Set([...subscribed, ...recent.map((r) => r.courseSlug).filter(Boolean)])];
	const found = await db.course.findMany({ where: { slug: { in: courseSlugs } }, select: { slug: true, title: true } });
	const bySlug = new Map(found.map((c) => [c.slug, c]));
	const courses = courseSlugs.map((s) => bySlug.get(s)).filter(Boolean);
	const liveSlugs = courses.map((c) => c.slug);

	// recently watched — published only, with last-opened time and own stars
	const cards = await cardsBySlugs(recent.map((r) => r.slug));
	const openedAt = new Map(recent.map((r) => [r.slug, r.lastOpenedAt]));
	const stars = await starsForSlugs(user.id, cards.map((c) => c.slug));
	const recentlyWatched = cards.map((c) => ({ ...c, lastOpenedAt: openedAt.get(c.slug), myStars: stars[c.slug] ?? null }));

	// continue, or first-day start
	let continueCard = null;
	let startHere = [];
	if (recentlyWatched.length) {
		const last = recentlyWatched[0];
		continueCard = { last, next: await nextInGroup(last.slug) };
	} else {
		startHere = (await Promise.all(liveSlugs.map((s) => firstInCourse(s)))).filter(Boolean);
	}

	// new in your courses — since last visit (first visit: last 2 weeks)
	const since = lastVisitAt ?? new Date(Date.now() - FIRST_VISIT_DAYS * 86400000);
	const publishEvents = await recentPublishes(liveSlugs, since, NEW_LIMIT);
	const newSlugs = [...new Set(publishEvents.map((e) => e.slug))];
	const publishedAt = new Map();
	for (const e of publishEvents) if (!publishedAt.has(e.slug)) publishedAt.set(e.slug, e.createdAt);
	const newItems = (await cardsBySlugs(newSlugs)).map((c) => ({ ...c, publishedAt: publishedAt.get(c.slug) }));

	// messages + announcements
	const [messages, unread, announcements] = await Promise.all([
		listForUser(user.id, { limit: LIST_LIMIT }),
		unreadReplies(user.id),
		forStudent(user.id, liveSlugs, { limit: LIST_LIMIT })
	]);

	// record this visit AFTER reading the previous one
	trackEvent("hub.open", { userId: user.id, role: "student" });

	return {
		user: { name: user.name, email: user.email },
		lastVisitAt,
		courses,
		continue: continueCard,
		startHere,
		newItems,
		messages,
		unreadReplies: unread,
		announcements,
		recentlyWatched
	};
}