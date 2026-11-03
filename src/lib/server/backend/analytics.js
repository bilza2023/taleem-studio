// /home/bilal-tariq/00--TALEEM/taleem/src/lib/server/backend/analytics.js

import kernel from "../../taleem-kernel";

// Only these names may come from the browser.
const CLIENT_EVENTS = ["lesson.open", "lesson.complete"];

// Who is calling? Token decides — never the request body.
async function resolveActor(token) {
	if (!token) return { userId: null, role: null };

	try {
		const admin = await kernel.admin.authenticate(token);
		return { userId: admin.id, role: "admin" };
	} catch {}

	try {
		const user = await kernel.user.authenticate(token);
		return { userId: user.id, role: "student" };
	} catch {}

	return { userId: null, role: null };
}

export async function trackEvent(data = {}, token) {
	const { name, slug, meta = null } = data;

	if (!CLIENT_EVENTS.includes(name)) {
		const err = new Error(`Invalid analytics event: ${name}`);
		err.status = 400;
		throw err;
	}

	const lesson = await kernel.library.get(slug, { includeUnpublished: true });

	if (!lesson) {
		const err = new Error(`Library item "${slug}" not found.`);
		err.status = 404;
		throw err;
	}

	const actor = await resolveActor(token);

	// not awaited — response goes back immediately
	kernel.analytics.track(name, {
		...actor,
		slug,
		courseSlug: lesson.courseSlug,
		meta
	});

	return { ok: true };
}
export async function getSummary(data = {}, token) {
	await kernel.admin.authenticate(token); // admins only

	const days = Number(data.days) || 0; // 0 = all time
	const since = days ? new Date(Date.now() - days * 86400000) : null;

	const [report, courses, items] = await Promise.all([
		kernel.analytics.summary({ since }),
		kernel.course.list(),
		kernel.library.list({}, { includeUnpublished: true })
	]);

	const lessonTitle = new Map(items.map((i) => [i.slug, i.title]));
	const stats = new Map(report.courses.map((c) => [c.courseSlug, c]));
	const empty = { opens: { total: 0, student: 0, admin: 0, anonymous: 0 }, uniqueStudents: 0, lessons: [] };

	// every course appears, even with zero activity
	const rows = courses.map((course) => {
		const s = stats.get(course.slug) ?? empty;
		return {
			courseSlug: course.slug,
			title: course.title ?? course.slug,
			opens: s.opens,
			uniqueStudents: s.uniqueStudents,
			lessons: s.lessons.map((l) => ({ ...l, title: lessonTitle.get(l.slug) ?? l.slug }))
		};
	});

	return { totals: report.totals, courses: rows };
}