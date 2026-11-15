// tests/structure.test.js
// course + group: visibility of inactive courses, create/update/delete rules, reorder, admin cleanup.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "$lib/server/dispatcher.js";
import { db } from "$lib/server/db.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const C = `t-struct-${run}`;
const HIDDEN = `t-hidden-${run}`;

async function call(module, method, data = {}, actor = "anon") {
	try {
		return { status: 200, body: await request({ module, method, data, ...w.actors[actor] }) };
	} catch (err) {
		return { status: err.status ?? 500, body: err.message };
	}
}

beforeAll(async () => {
	w = await createWorld();
	await db.course.create({ data: { slug: HIDDEN, title: "Hidden", isActive: false } });
});

afterAll(async () => {
	await db.library.deleteMany({ where: { courseSlug: C } });
	await db.group.deleteMany({ where: { courseSlug: { in: [C, HIDDEN] } } });
	await db.course.deleteMany({ where: { slug: { in: [C, HIDDEN] } } });
	await destroyWorld(w);
	await db.$disconnect();
});

describe("course — reading", () => {
	it("inactive course: hidden from students, visible to admins", async () => {
		const anonList = await call("course", "list");
		expect(anonList.body.map((c) => c.slug)).not.toContain(HIDDEN);

		const adminList = await call("course", "list", {}, "teacherA");
		expect(adminList.body.map((c) => c.slug)).toContain(HIDDEN);

		expect((await call("course", "get", { slug: HIDDEN })).status).toBe(404);
		expect((await call("course", "get", { slug: HIDDEN }, "super")).status).toBe(200);
	});

	it("unknown course → 404", async () => {
		expect((await call("course", "get", { slug: "no-such-course" })).status).toBe(404);
	});
});

describe("course — writing (super)", () => {
	it("create → course; duplicate → 409; missing title → 400", async () => {
		const r = await call("course", "create", { slug: C, title: "Struct", access: "SUBSCRIPTION", price: 8000 }, "super");
		expect(r.status).toBe(200);
		expect(r.body.access).toBe("SUBSCRIPTION");
		expect(r.body.price).toBe(8000);

		expect((await call("course", "create", { slug: C, title: "Again" }, "super")).status).toBe(409);
		expect((await call("course", "create", { slug: `x-${run}` }, "super")).status).toBe(400);
	});

	it("bad access → 400; bad price → 400", async () => {
		expect((await call("course", "create", { slug: `y-${run}`, title: "Y", access: "VIP" }, "super")).status).toBe(400);
		expect((await call("course", "create", { slug: `z-${run}`, title: "Z", price: -5 }, "super")).status).toBe(400);
	});

	it("update → changed; nothing valid → 400; unknown → 404", async () => {
		const r = await call("course", "update", { slug: C, changes: { title: "Renamed", slug: "hijack" } }, "super");
		expect(r.body.title).toBe("Renamed");
		expect(r.body.slug).toBe(C);
		expect((await call("course", "update", { slug: C, changes: { foo: 1 } }, "super")).status).toBe(400);
		expect((await call("course", "update", { slug: "nope", changes: { title: "x" } }, "super")).status).toBe(404);
	});
});

describe("group", () => {
	it("create appends in order; unknown course → 404; duplicate → 409", async () => {
		for (const s of ["one", "two", "three"]) {
			expect((await call("group", "create", { courseSlug: C, slug: s, title: s }, "super")).status).toBe(200);
		}
		const list = await call("group", "list", { courseSlug: C });
		expect(list.body.map((g) => g.slug)).toEqual(["one", "two", "three"]);

		expect((await call("group", "create", { courseSlug: "nope", slug: "a", title: "a" }, "super")).status).toBe(404);
		expect((await call("group", "create", { courseSlug: C, slug: "one", title: "x" }, "super")).status).toBe(409);
	});

	it("list without courseSlug → 400; get unknown → 404", async () => {
		expect((await call("group", "list", {})).status).toBe(400);
		expect((await call("group", "get", { courseSlug: C, groupSlug: "nope" })).status).toBe(404);
	});

	it("update title; slug cannot change", async () => {
		const r = await call("group", "update", { courseSlug: C, groupSlug: "one", changes: { title: "First", slug: "hijack" } }, "super");
		expect(r.body.title).toBe("First");
		expect(r.body.slug).toBe("one");
	});

	it("reorder: full list works; partial list → 400", async () => {
		const r = await call("group", "reorder", { courseSlug: C, slugs: ["three", "one", "two"] }, "super");
		expect(r.status).toBe(200);
		expect(r.body.map((g) => g.slug)).toEqual(["three", "one", "two"]);

		expect((await call("group", "reorder", { courseSlug: C, slugs: ["one", "two"] }, "super")).status).toBe(400);
	});

	it("delete blocked while it has items → 409; empty group deletes", async () => {
		await db.library.create({ data: { slug: `t-item-${run}`, courseSlug: C, groupSlug: "two", type: "PLAYER", title: "x" } });
		expect((await call("group", "delete", { courseSlug: C, groupSlug: "two" }, "super")).status).toBe(409);
		expect((await call("group", "delete", { courseSlug: C, groupSlug: "three" }, "super")).status).toBe(200);
	});
});

describe("course — delete", () => {
	it("blocked while groups exist → 409", async () => {
		expect((await call("course", "delete", { slug: C }, "super")).status).toBe(409);
	});

	it("successful delete removes the course from every admin's list", async () => {
		const temp = `t-temp-${run}`;
		await call("course", "create", { slug: temp, title: "Temp" }, "super");
		await call("admin", "assignCourse", { email: w.admins[0].email, courseSlug: temp }, "super");

		expect((await call("course", "delete", { slug: temp }, "super")).status).toBe(200);

		const me = await call("admin", "me", {}, "teacherA");
		expect(me.body.courseSlugs).not.toContain(temp);
	});
});