// src/lib/server/modules/analytics.js

import { db } from "../db.js";
import { fail } from "../access.js";

// only these names may come from the browser
const CLIENT_EVENTS = ["lesson.open", "lesson.complete"];

// ── data: event writers (used by library, hub, mcqResult) ──

// awaited, throws — when the caller must know it was saved
export async function recordEvent(name, { userId = null, role = null, slug = null, courseSlug = null, meta = null } = {}) {
	if (!name) throw new Error("recordEvent: name is required");
	return db.analyticsEvent.create({
		data: { name, userId, role, slug, courseSlug, meta: meta ? JSON.stringify(meta) : null }
	});
}

// fire-and-forget — never throws, callers don't await
export function trackEvent(name, opts = {}) {
	return recordEvent(name, opts).catch((err) => {
		console.error(`trackEvent: '${name}' failed —`, err.message);
		return null;
	});
}

// who is acting — from ctx, never the body.
// admin wins when both are logged in, so admin browsing never inflates student numbers.
export function actor(ctx) {
	if (ctx.admin) return { userId: ctx.admin.id, role: "admin" };
	if (ctx.user) return { userId: ctx.user.id, role: "student" };
	return { userId: null, role: null };
}

// ── api ───────────────────────────────────────────────────

// public — { name, slug, meta? } → { ok: true }
export async function track(input, ctx) {
	const { name, slug, meta = null } = input;
	if (!CLIENT_EVENTS.includes(name)) fail(400, `Invalid analytics event: ${name}`);

	const lesson = await db.library.findUnique({
		where: { slug: String(slug ?? "") },
		select: { slug: true, courseSlug: true }
	});
	if (!lesson) fail(404, `Library item "${slug}" not found.`);

	trackEvent(name, { ...actor(ctx), slug: lesson.slug, courseSlug: lesson.courseSlug, meta }); // not awaited
	return { ok: true };
}

// super — { days? } (0 / missing = all time) → report; every course listed, even with no activity
export async function summary(input) {
	const days = Number(input.days) || 0;
	const since = days ? new Date(Date.now() - days * 86400000) : null;

	const where = { name: "lesson.open", ...(since ? { createdAt: { gte: since } } : {}) };

	const [rows, courses, items] = await Promise.all([
		db.analyticsEvent.groupBy({ by: ["courseSlug", "slug", "role", "userId"], where, _count: { _all: true } }),
		db.course.findMany({ orderBy: [{ sortOrder: "asc" }, { slug: "asc" }] }),
		db.library.findMany({ select: { slug: true, title: true } })
	]);

	const blank = () => ({ total: 0, student: 0, admin: 0, anonymous: 0 });
	const add = (opens, role, n) => {
		opens[role ?? "anonymous"] += n;
		opens.total += n;
	};

	const totals = { opens: blank(), students: new Set() };
	const stats = new Map();

	for (const r of rows) {
		const n = r._count._all;
		if (!stats.has(r.courseSlug)) {
			stats.set(r.courseSlug, { opens: blank(), students: new Set(), lessons: new Map() });
		}
		const c = stats.get(r.courseSlug);
		if (!c.lessons.has(r.slug)) c.lessons.set(r.slug, { slug: r.slug, opens: blank(), students: new Set() });
		const l = c.lessons.get(r.slug);

		add(totals.opens, r.role, n);
		add(c.opens, r.role, n);
		add(l.opens, r.role, n);

		if (r.role === "student" && r.userId != null) {
			totals.students.add(r.userId);
			c.students.add(r.userId);
			l.students.add(r.userId);
		}
	}

	const lessonTitle = new Map(items.map((i) => [i.slug, i.title]));

	// every course appears, even with zero activity
	const out = courses.map((course) => {
		const c = stats.get(course.slug);
		return {
			courseSlug: course.slug,
			title: course.title ?? course.slug,
			opens: c ? c.opens : blank(),
			uniqueStudents: c ? c.students.size : 0,
			lessons: c
				? [...c.lessons.values()]
						.map((l) => ({ slug: l.slug, title: lessonTitle.get(l.slug) ?? l.slug, opens: l.opens, uniqueStudents: l.students.size }))
						.sort((a, b) => b.opens.total - a.opens.total)
				: []
		};
	});

	return { totals: { opens: totals.opens, uniqueStudents: totals.students.size }, courses: out };
}