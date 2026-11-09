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

// Awaited — the student sees "Saved ✓" only if the row really exists.
// Deliberately NOT in CLIENT_EVENTS: mcq.result can only arrive through here.
// meta = the full report from buildReport() (what the student saw).
export async function saveMcqResult(data = {}, token) {
	const { slug, meta = null } = data;

	if (meta && JSON.stringify(meta).length > 100_000) {
		const err = new Error("MCQ result too large.");
		err.status = 413;
		throw err;
	}

	const actor = await resolveActor(token);
	if (!actor.role) return { saved: false, reason: "login" }; // anonymous: show, don't save

	const item = await kernel.library.get(slug, { includeUnpublished: true });
	if (!item || item.type !== "MCQ") {
		const err = new Error(`MCQ "${slug}" not found.`);
		err.status = 404;
		throw err;
	}

	const row = await kernel.analytics.record("mcq.result", {
		...actor,
		slug,
		courseSlug: item.courseSlug,
		meta
	});

	return { saved: true, id: row.id };
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

// Student's own MCQ history — identity from the token, never from the body.
// Each item carries the full saved report, so opening one needs no second call.
export async function listMyMcqResults(data = {}, token) {
	const actor = await resolveActor(token);
	if (!actor.role) {
		const err = new Error("Log in to see your results.");
		err.status = 401;
		throw err;
	}

	const result = await kernel.analytics.listPage(
		{ name: "mcq.result", userId: actor.userId, role: actor.role },
		{ page: data.page, pageSize: data.pageSize }
	);

	// titles for this page only
	const slugs = [...new Set(result.items.map((r) => r.slug).filter(Boolean))];
	const libs = await Promise.all(
		slugs.map((s) => kernel.library.get(s, { includeUnpublished: true }).catch(() => null))
	);
	const titles = new Map(slugs.map((s, i) => [s, libs[i]?.title ?? s]));

	const parse = (txt) => {
		try { return txt ? JSON.parse(txt) : null; } catch { return null; }
	};

	return {
		...result,
		items: result.items.map((r) => ({
			id: r.id,
			slug: r.slug,
			title: titles.get(r.slug) ?? r.slug,
			createdAt: r.createdAt,
			report: parse(r.meta)
		}))
	};
}