
// tests/communication.test.js
// inquiry (weekly limit, reply flow), rating (options, re-rate, allowCommunication), notification, hub.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "$lib/server/dispatcher.js";
import { db } from "$lib/server/db.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const noRate = `t-norate-${run}`;
const draft = `t-cdraft-${run}`;
const notes = [];

async function call(module, method, data = {}, actor = "anon") {
	try {
		return { status: 200, body: await request({ module, method, data, ...w.actors[actor] }) };
	} catch (err) {
		return { status: err.status ?? 500, body: err.message };
	}
}

async function waitFor(fn, ms = 1500) {
	const end = Date.now() + ms;
	while (Date.now() < end) {
		const v = await fn();
		if (v) return v;
		await new Promise((r) => setTimeout(r, 50));
	}
	return null;
}

beforeAll(async () => {
	w = await createWorld();
	await db.library.create({ data: { slug: noRate, courseSlug: w.A, groupSlug: "g1", type: "PLAYER", title: "x", status: "PUBLISHED", allowCommunication: false } });
	await db.library.create({ data: { slug: draft, courseSlug: w.A, groupSlug: "g1", type: "PLAYER", title: "x", status: "DRAFT" } });
});

afterAll(async () => {
	await db.notification.deleteMany({ where: { id: { in: notes } } });
	await db.analyticsEvent.deleteMany({ where: { userId: w.student.id, role: "student" } });
	await db.library.deleteMany({ where: { slug: { in: [noRate, draft] } } });
	await destroyWorld(w); // student delete cascades inquiries + ratings
	await db.$disconnect();
});

describe("inquiry", () => {
	// world already gave the student 1 inquiry this week → limit 2 leaves room for exactly 1
	it("create: ok, unknown course is dropped to null", async () => {
		const r = await call("inquiry", "create", { message: "  help  ", courseSlug: "no-such-course" }, "student");
		expect(r.status).toBe(200);
		expect(r.body.message).toBe("help");
		expect(r.body.courseSlug).toBeNull();
	});

	it("weekly limit reached → 429; empty message → 400", async () => {
		expect((await call("inquiry", "create", { message: "again" }, "student")).status).toBe(429);
		expect((await call("inquiry", "create", { message: "   " }, "student")).status).toBe(400);
	});

	it("mine: own inquiries, no team-only fields", async () => {
		const r = await call("inquiry", "mine", {}, "student");
		expect(r.body.length).toBeGreaterThanOrEqual(2);
		expect(r.body[0].tags).toBeUndefined();
		expect(r.body[0].repliedBy).toBeUndefined();
	});

	it("team: list by course, reply → ANSWERED with repliedBy", async () => {
		const list = await call("inquiry", "list", { courseSlug: w.A }, "teacherA");
		expect(list.body.items.map((i) => i.id)).toContain(w.inquiry.id);

		const r = await call("inquiry", "reply", { id: w.inquiry.id, reply: "done" }, "teacherA");
		expect(r.body.status).toBe("ANSWERED");
		expect(r.body.repliedBy).toBe(w.admins[0].email);
	});

	it("empty reply → 400; bad status → 400; tags must be array → 400", async () => {
		expect((await call("inquiry", "reply", { id: w.inquiry.id, reply: " " }, "teacherA")).status).toBe(400);
		expect((await call("inquiry", "setStatus", { id: w.inquiry.id, status: "LOST" }, "teacherA")).status).toBe(400);
		expect((await call("inquiry", "setTags", { id: w.inquiry.id, tags: "x" }, "teacherA")).status).toBe(400);
	});

	it("setStatus + setTags work", async () => {
		expect((await call("inquiry", "setStatus", { id: w.inquiry.id, status: "CLOSED" }, "teacherA")).body.status).toBe("CLOSED");
		expect((await call("inquiry", "setTags", { id: w.inquiry.id, tags: ["billing"] }, "teacherA")).body.tags).toEqual(["billing"]);
	});

	it("markRead clears the reply badge", async () => {
		await db.inquiry.update({ where: { id: w.inquiry.id }, data: { status: "ANSWERED", replyReadAt: null } });
		expect((await call("hub", "get", {}, "student")).body.unreadReplies).toBe(1);
		await call("inquiry", "markRead", {}, "student");
		expect((await call("hub", "get", {}, "student")).body.unreadReplies).toBe(0);
	});
});

describe("rating", () => {
	it("options: the fixed list of 3", async () => {
		const r = await call("rating", "options");
		expect(r.body.map((o) => o.key)).toEqual(["wasClear", "hasErrors", "moreDetails"]);
	});

	it("save: unknown options dropped, comment capped at 300", async () => {
		const r = await call("rating", "save",
			{ librarySlug: w.lesson.slug, stars: 4, options: ["wasClear", "bogus"], comment: "x".repeat(400) }, "student");
		expect(r.status).toBe(200);
		expect(r.body.options).toEqual(["wasClear"]);
		expect(r.body.comment.length).toBe(300);
		expect(r.body.courseSlug).toBe(w.A);
	});

	it("re-rating updates the same row", async () => {
		await call("rating", "save", { librarySlug: w.lesson.slug, stars: 2 }, "student");
		const mine = await call("rating", "mine", { librarySlug: w.lesson.slug }, "student");
		expect(mine.body.stars).toBe(2);
		expect(await db.rating.count({ where: { userId: w.student.id, librarySlug: w.lesson.slug } })).toBe(1);
	});

	it("bad stars → 400; draft lesson → 404; rating turned off → 403", async () => {
		expect((await call("rating", "save", { librarySlug: w.lesson.slug, stars: 9 }, "student")).status).toBe(400);
		expect((await call("rating", "save", { librarySlug: draft, stars: 3 }, "student")).status).toBe(404);
		expect((await call("rating", "save", { librarySlug: noRate, stars: 3 }, "student")).status).toBe(403);
	});

	it("summary: whole course, one deck, deck from another course → 404", async () => {
		const course = await call("rating", "summary", { courseSlug: w.A }, "teacherA");
		expect(course.body.find((d) => d.librarySlug === w.lesson.slug).count).toBe(1);

		const deck = await call("rating", "summary", { courseSlug: w.A, librarySlug: w.lesson.slug }, "teacherA");
		expect(deck.body.average).toBe(2);

		expect((await call("rating", "summary", { courseSlug: w.B, librarySlug: w.lesson.slug }, "super")).status).toBe(404);
	});

	it("list: paged ratings with student email", async () => {
		const r = await call("rating", "list", { courseSlug: w.A }, "teacherA");
		expect(r.body.total).toBeGreaterThanOrEqual(1);
		expect(r.body.items[0].user.email).toBe(w.student.email);
	});
});

describe("notification (super)", () => {
	it("create APP; the student sees it on the hub", async () => {
		const r = await call("notification", "create", { audience: "APP", title: `Hello ${run}` }, "super");
		expect(r.status).toBe(200);
		expect(r.body.createdBy).toBe(w.admins[2].email);
		notes.push(r.body.id);

		const hub = await call("hub", "get", {}, "student");
		expect(hub.body.announcements.map((a) => a.title)).toContain(`Hello ${run}`);
	});

	it("validation: bad audience, COURSE without/unknown course, USER unknown, no title", async () => {
		expect((await call("notification", "create", { audience: "ALL", title: "x" }, "super")).status).toBe(400);
		expect((await call("notification", "create", { audience: "COURSE", title: "x" }, "super")).status).toBe(400);
		expect((await call("notification", "create", { audience: "COURSE", courseSlug: "nope", title: "x" }, "super")).status).toBe(404);
		expect((await call("notification", "create", { audience: "USER", userId: 99999999, title: "x" }, "super")).status).toBe(404);
		expect((await call("notification", "create", { audience: "APP" }, "super")).status).toBe(400);
	});

	it("list + delete; delete unknown → 404", async () => {
		const list = await call("notification", "list", {}, "super");
		expect(list.body.items.map((n) => n.id)).toContain(notes[0]);
		expect((await call("notification", "delete", { id: notes[0] }, "super")).status).toBe(200);
		expect((await call("notification", "delete", { id: notes[0] }, "super")).status).toBe(404);
	});
});

describe("hub", () => {
	it("returns the full shape and records the visit", async () => {
		const r = await call("hub", "get", {}, "student");
		for (const key of ["user", "lastVisitAt", "courses", "continue", "startHere", "newItems", "messages", "unreadReplies", "announcements", "recentlyWatched"]) {
			expect(r.body).toHaveProperty(key);
		}
		expect(r.body.user.email).toBe(w.student.email);

		const visit = await waitFor(() => db.analyticsEvent.findFirst({ where: { name: "hub.open", userId: w.student.id } }));
		expect(visit).not.toBeNull();
	});
});