// tests/library.test.js
// Content: visibility, paid gate, samples, lists, create/update/archive/delete, publish tracking.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "$lib/server/dispatcher.js";
import { db } from "$lib/server/db.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const P = `t-paid-${run}`; // a SUBSCRIPTION course
const slug = (s) => `t-${s}-${run}`;
const created = []; // every library slug this file makes

async function call(module, method, data = {}, actor = "anon", extra = {}) {
	try {
		const body = await request({ module, method, data, ...w.actors[actor], ...extra });
		return { status: 200, body };
	} catch (err) {
		return { status: err.status ?? 500, body: err.message };
	}
}

async function item(data) {
	created.push(data.slug);
	return db.library.create({ data: { type: "PLAYER", title: data.slug, ...data } });
}

// fire-and-forget events land a moment later
async function waitForEvent(where, ms = 1500) {
	const end = Date.now() + ms;
	while (Date.now() < end) {
		const e = await db.analyticsEvent.findFirst({ where });
		if (e) return e;
		await new Promise((r) => setTimeout(r, 50));
	}
	return null;
}

beforeAll(async () => {
	w = await createWorld();

	// open course A (from world) gets a draft and an archived item
	await item({ slug: slug("draft"), courseSlug: w.A, groupSlug: "g1", status: "DRAFT", body: JSON.stringify({ deck: [{}], audio: "x.opus" }) });
	await item({ slug: slug("archived"), courseSlug: w.A, groupSlug: "g1", status: "ARCHIVED" });

	// paid course P: one normal lesson, one free sample
	await db.course.create({ data: { slug: P, title: "Paid", access: "SUBSCRIPTION" } });
	await db.group.create({ data: { courseSlug: P, slug: "g1", title: "G" } });
	await item({ slug: slug("paid"), courseSlug: P, groupSlug: "g1", status: "PUBLISHED" });
	await item({ slug: slug("sample"), courseSlug: P, groupSlug: "g1", status: "PUBLISHED", tags: JSON.stringify(["pinned"]) });

	// a group in B, for the move test
	await db.group.create({ data: { courseSlug: w.B, slug: "g1", title: "G" } });
});

afterAll(async () => {
	await db.analyticsEvent.deleteMany({ where: { slug: { in: created } } });
	await db.library.deleteMany({ where: { slug: { in: created } } });
	await db.subscription.deleteMany({ where: { courseSlug: P } });
	await db.group.deleteMany({ where: { courseSlug: { in: [P, w.B] } } });
	await db.course.deleteMany({ where: { slug: P } });
	await destroyWorld(w);
	await db.$disconnect();
});

describe("library.get — visibility", () => {
	it("published item in an open course: anyone", async () => {
		const r = await call("library", "get", { slug: w.lesson.slug });
		expect(r.status).toBe(200);
		expect(Array.isArray(r.body.tags)).toBe(true);
	});

	it("draft: outsiders 404, own teacher 200, other teacher 404, super 200", async () => {
		const d = { slug: slug("draft") };
		expect((await call("library", "get", d)).status).toBe(404);
		expect((await call("library", "get", d, "student")).status).toBe(404);
		expect((await call("library", "get", d, "teacherA")).status).toBe(200);
		expect((await call("library", "get", d, "teacherB")).status).toBe(404);
		expect((await call("library", "get", d, "super")).status).toBe(200);
	});

	it("missing slug → 404, empty slug → 400", async () => {
		expect((await call("library", "get", { slug: "no-such-thing" })).status).toBe(404);
		expect((await call("library", "get", {})).status).toBe(400);
	});
});

describe("library.get — paid gate", () => {
	const d = () => ({ slug: slug("paid") });

	it("anonymous → 401", async () => {
		expect((await call("library", "get", d())).status).toBe(401);
	});

	it("student without subscription → 403", async () => {
		expect((await call("library", "get", d(), "student")).status).toBe(403);
	});

	it("pinned sample opens for anyone", async () => {
		expect((await call("library", "get", { slug: slug("sample") })).status).toBe(200);
	});

	it("super passes without subscription", async () => {
		expect((await call("library", "get", d(), "super")).status).toBe(200);
	});

	it("student with an active subscription → 200; cancelled → 403 again", async () => {
		const sub = await db.subscription.create({
			data: { userId: w.student.id, courseSlug: P, startsAt: new Date(Date.now() - 86400000), endsAt: new Date(Date.now() + 86400000) }
		});
		expect((await call("library", "get", d(), "student")).status).toBe(200);

		await db.subscription.update({ where: { id: sub.id }, data: { cancelledAt: new Date() } });
		expect((await call("library", "get", d(), "student")).status).toBe(403);
	});
});

describe("lists", () => {
	it("outsiders see published only, without body", async () => {
		const r = await call("library", "list", { courseSlug: w.A });
		const slugs = r.body.map((i) => i.slug);
		expect(slugs).toContain(w.lesson.slug);
		expect(slugs).not.toContain(slug("draft"));
		expect(slugs).not.toContain(slug("archived"));
		expect(r.body.every((i) => i.body === undefined)).toBe(true);
	});

	it("own teacher sees every status, with flags instead of body", async () => {
		const r = await call("library", "list", { courseSlug: w.A }, "teacherA");
		const draft = r.body.find((i) => i.slug === slug("draft"));
		expect(draft).toBeDefined();
		expect(draft.hasDeck).toBe(true);
		expect(draft.hasAudio).toBe(true);
		expect(draft.body).toBeUndefined();
		expect(r.body.map((i) => i.slug)).toContain(slug("archived"));
	});

	it("teacher can filter by status at course level (no group needed)", async () => {
		const r = await call("library", "list", { courseSlug: w.A, status: "DRAFT" }, "teacherA");
		expect(r.body.every((i) => i.status === "DRAFT")).toBe(true);
	});

	it("other teacher gets the outsider view", async () => {
		const r = await call("library", "list", { courseSlug: w.A }, "teacherB");
		expect(r.body.map((i) => i.slug)).not.toContain(slug("draft"));
	});

	it("studentList: published + drafts, never archived", async () => {
		const r = await call("library", "studentList", { courseSlug: w.A });
		const slugs = r.body.map((i) => i.slug);
		expect(slugs).toContain(w.lesson.slug);
		expect(slugs).toContain(slug("draft"));
		expect(slugs).not.toContain(slug("archived"));
	});

	it("studentList without courseSlug → 400", async () => {
		expect((await call("library", "studentList", {})).status).toBe(400);
	});
});

describe("create", () => {
	it("teacher creates in own course; default status DRAFT; tags come back as array", async () => {
		created.push(slug("new"));
		const r = await call("library", "create",
			{ slug: slug("new"), courseSlug: w.A, groupSlug: "g1", type: "ARTICLE", title: "New", tags: ["a", "b"] }, "teacherA");
		expect(r.status).toBe(200);
		expect(r.body.status).toBe("DRAFT");
		expect(r.body.tags).toEqual(["a", "b"]);
	});

	it("MCQ type is allowed", async () => {
		created.push(slug("mcq"));
		const r = await call("library", "create",
			{ slug: slug("mcq"), courseSlug: w.A, groupSlug: "g1", type: "MCQ" }, "teacherA");
		expect(r.status).toBe(200);
	});

	it("bad type → 400; missing group → 400; duplicate → 409", async () => {
		const base = { courseSlug: w.A, groupSlug: "g1", type: "PLAYER" };
		expect((await call("library", "create", { ...base, slug: slug("x1"), type: "VIDEO" }, "teacherA")).status).toBe(400);
		expect((await call("library", "create", { ...base, slug: slug("x2"), groupSlug: "nope" }, "teacherA")).status).toBe(400);
		expect((await call("library", "create", { ...base, slug: slug("new") }, "teacherA")).status).toBe(409);
	});
});

describe("update / publish / move / archive / delete", () => {
	it("update title works; unknown fields are ignored; nothing valid → 400", async () => {
		const r = await call("library", "update", { slug: slug("new"), changes: { title: "Renamed", slug: "hijack" } }, "teacherA");
		expect(r.status).toBe(200);
		expect(r.body.title).toBe("Renamed");
		expect(r.body.slug).toBe(slug("new"));
		expect((await call("library", "update", { slug: slug("new"), changes: { foo: 1 } }, "teacherA")).status).toBe(400);
	});

	it("update cannot set ARCHIVED → 400", async () => {
		expect((await call("library", "update", { slug: slug("new"), changes: { status: "ARCHIVED" } }, "teacherA")).status).toBe(400);
	});

	it("publishing records lesson.publish for the hub", async () => {
		const r = await call("library", "update", { slug: slug("new"), changes: { status: "PUBLISHED" } }, "teacherA");
		expect(r.body.status).toBe("PUBLISHED");
		const e = await waitForEvent({ name: "lesson.publish", slug: slug("new") });
		expect(e).not.toBeNull();
		expect(e.courseSlug).toBe(w.A);
	});

	it("move into a course the teacher doesn't teach → 403", async () => {
		const r = await call("library", "update", { slug: slug("new"), changes: { courseSlug: w.B, groupSlug: "g1" } }, "teacherA");
		expect(r.status).toBe(403);
	});

	it("super can move between courses; group must exist there", async () => {
		expect((await call("library", "update", { slug: slug("mcq"), changes: { courseSlug: w.B, groupSlug: "nope" } }, "super")).status).toBe(400);
		const r = await call("library", "update", { slug: slug("mcq"), changes: { courseSlug: w.B, groupSlug: "g1" } }, "super");
		expect(r.status).toBe(200);
		expect(r.body.courseSlug).toBe(w.B);
	});

	it("archive hides the item from students", async () => {
		const r = await call("library", "archive", { slug: slug("new") }, "teacherA");
		expect(r.body.status).toBe("ARCHIVED");
		expect((await call("library", "get", { slug: slug("new") })).status).toBe(404);
		const list = await call("library", "studentList", { courseSlug: w.A });
		expect(list.body.map((i) => i.slug)).not.toContain(slug("new"));
	});

	it("super deletes; then it is gone", async () => {
		expect((await call("library", "delete", { slug: slug("new") }, "super")).status).toBe(200);
		expect((await call("library", "get", { slug: slug("new") }, "super")).status).toBe(404);
	});
});