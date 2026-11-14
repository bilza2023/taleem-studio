// /home/bilal-tariq/00--TALEEM/taleem/src/lib/server/backend/hub.js
import kernel from "../../taleem-kernel";

const RECENT_LIMIT = 10;
const LIST_LIMIT = 5;
const NEW_LIMIT = 20;
const FIRST_VISIT_DAYS = 14; // no last visit yet → show the last 2 weeks

export async function getHub(token) {
	const user = await kernel.user.authenticate(token);

	const [subscribed, recent, lastVisitEvent] = await Promise.all([
		kernel.subscription.activeCourses(user.id),
		kernel.analytics.recentLessons(user.id, { limit: RECENT_LIMIT }),
		kernel.analytics.lastEvent("hub.open", user.id)
	]);
	const lastVisitAt = lastVisitEvent?.createdAt ?? null;

	// your courses = active subscriptions + courses with watch history
	const courseSlugs = [...new Set([...subscribed, ...recent.map((r) => r.courseSlug).filter(Boolean)])];
	const courses = (await Promise.all(courseSlugs.map((s) => kernel.course.get(s))))
		.filter(Boolean)
		.map((c) => ({ slug: c.slug, title: c.title }));
	const liveSlugs = courses.map((c) => c.slug);

	// recently watched — published decks only, with last-opened time and own stars
	const cards = await kernel.library.cardsBySlugs(recent.map((r) => r.slug));
	const openedAt = new Map(recent.map((r) => [r.slug, r.lastOpenedAt]));
	const stars = await kernel.rating.starsForSlugs(user.id, cards.map((c) => c.slug));
	const recentlyWatched = cards.map((c) => ({
		...c,
		lastOpenedAt: openedAt.get(c.slug),
		myStars: stars[c.slug] ?? null
	}));

	// continue or first-day start
	let continueCard = null;
	let startHere = [];
	if (recentlyWatched.length) {
		const last = recentlyWatched[0];
		continueCard = { last, next: await kernel.library.nextInGroup(last.slug) };
	} else {
		startHere = (await Promise.all(liveSlugs.map((s) => kernel.library.firstInCourse(s)))).filter(Boolean);
	}

	// new in your courses — since last visit (first visit: last 2 weeks)
	const since = lastVisitAt ?? new Date(Date.now() - FIRST_VISIT_DAYS * 86400000);
	const publishEvents = await kernel.analytics.recentInCourses("lesson.publish", liveSlugs, { since, limit: NEW_LIMIT });
	const newSlugs = [...new Set(publishEvents.map((e) => e.slug))]; // re-published once → shown once
	const publishedAt = new Map();
	for (const e of publishEvents) if (!publishedAt.has(e.slug)) publishedAt.set(e.slug, e.createdAt);
	const newItems = (await kernel.library.cardsBySlugs(newSlugs))
		.map((c) => ({ ...c, publishedAt: publishedAt.get(c.slug) }));

	// messages + announcements
	const [messages, unreadReplies, announcements] = await Promise.all([
		kernel.inquiry.listForUser(user.id, { limit: LIST_LIMIT }),
		kernel.inquiry.unreadReplies(user.id),
		kernel.notification.forStudent(user.id, liveSlugs, { limit: LIST_LIMIT })
	]);

	// record this visit AFTER reading the previous one
	kernel.analytics.track("hub.open", { userId: user.id, role: "student" });

	return {
		user: { name: user.name, email: user.email },
		lastVisitAt,
		courses,
		continue: continueCard,
		startHere,
		newItems,
		messages,
		unreadReplies,
		announcements,
		recentlyWatched
	};
}