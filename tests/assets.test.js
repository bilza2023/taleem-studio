// tests/assets.test.js
// image / audio / svg + assets picker: slug rule, paging, body omission, bulkCreate atomicity, delete.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "$lib/server/dispatcher.js";
import { db } from "$lib/server/db.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const svg = (s) => `t-${s}-${run}.svg`;
const img = `t-img-${run}.png`;
const aud = `t-aud-${run}.opus`;

async function call(module, method, data = {}, actor = "anon") {
	try {
		return { status: 200, body: await request({ module, method, data, ...w.actors[actor] }) };
	} catch (err) {
		return { status: err.status ?? 500, body: err.message };
	}
}

beforeAll(async () => { w = await createWorld(); });

afterAll(async () => {
	await db.svg.deleteMany({ where: { slug: { contains: `-${run}` } } });
	await db.image.deleteMany({ where: { slug: { contains: `-${run}` } } });
	await db.audio.deleteMany({ where: { slug: { contains: `-${run}` } } });
	await destroyWorld(w);
	await db.$disconnect();
});

describe("svg", () => {
	it("create: valid slug; title defaults to slug; tags as array", async () => {
		const r = await call("svg", "create", { slug: svg("one"), body: "<svg/>", tags: ["math"] }, "teacherA");
		expect(r.status).toBe(200);
		expect(r.body.title).toBe(svg("one"));
		expect(r.body.tags).toEqual(["math"]);
	});

	it("slug without .svg → 400; duplicate → 409", async () => {
		expect((await call("svg", "create", { slug: `t-bad-${run}`, body: "" }, "teacherA")).status).toBe(400);
		expect((await call("svg", "create", { slug: svg("one"), body: "" }, "teacherA")).status).toBe(409);
	});

	it("get keeps .svg in the slug (old getAsset bug gone)", async () => {
		const r = await call("svg", "get", { slug: svg("one") });
		expect(r.status).toBe(200);
		expect(r.body.body).toBe("<svg/>");
	});

	it("list: paged, body left out unless full: true; search works", async () => {
		const r = await call("svg", "list", { search: `one-${run}` });
		expect(r.body.total).toBe(1);
		expect(r.body.items[0].body).toBeUndefined();

		const full = await call("svg", "list", { search: `one-${run}`, full: true });
		expect(full.body.items[0].body).toBe("<svg/>");
	});

	it("update: tags + title; nothing valid → 400; unknown → 404", async () => {
		const r = await call("svg", "update", { slug: svg("one"), changes: { title: "One", tags: ["a"] } }, "teacherA");
		expect(r.body.title).toBe("One");
		expect(r.body.tags).toEqual(["a"]);
		expect((await call("svg", "update", { slug: svg("one"), changes: { foo: 1 } }, "teacherA")).status).toBe(400);
		expect((await call("svg", "update", { slug: svg("nope"), changes: { title: "x" } }, "teacherA")).status).toBe(404);
	});
});

describe("svg.bulkCreate — all or nothing", () => {
	it("creates all; title from slug", async () => {
		const r = await call("svg", "bulkCreate", { slugs: [svg("bulk-a"), svg("bulk-b")] }, "teacherA");
		expect(r.status).toBe(200);
		expect(r.body.length).toBe(2);
		expect(r.body[0].title).toBe(`t bulk a ${run}`);
	});

	it("one invalid slug → 400, nothing created", async () => {
		const r = await call("svg", "bulkCreate", { slugs: [svg("fresh1"), `t-noext-${run}`] }, "teacherA");
		expect(r.status).toBe(400);
		expect(await db.svg.findUnique({ where: { slug: svg("fresh1") } })).toBeNull();
	});

	it("one existing slug → 409, nothing created", async () => {
		const r = await call("svg", "bulkCreate", { slugs: [svg("fresh2"), svg("bulk-a")] }, "teacherA");
		expect(r.status).toBe(409);
		expect(await db.svg.findUnique({ where: { slug: svg("fresh2") } })).toBeNull();
	});

	it("duplicates inside the batch → 400; empty → 400", async () => {
		expect((await call("svg", "bulkCreate", { slugs: [svg("d"), svg("d")] }, "teacherA")).status).toBe(400);
		expect((await call("svg", "bulkCreate", { slugs: [] }, "teacherA")).status).toBe(400);
	});
});

describe("image + audio", () => {
	it("create / get / update", async () => {
		expect((await call("image", "create", { slug: img, title: "Pic" }, "teacherA")).status).toBe(200);
		expect((await call("audio", "create", { slug: aud }, "teacherA")).status).toBe(200);
		expect((await call("image", "get", { slug: img })).body.title).toBe("Pic");
		const u = await call("audio", "update", { slug: aud, changes: { tags: ["voice"] } }, "teacherA");
		expect(u.body.tags).toEqual(["voice"]);
	});

	it("list is paged with totals", async () => {
		const r = await call("image", "list", { search: `img-${run}` });
		expect(r.body.total).toBe(1);
		expect(r.body.pages).toBe(1);
	});
});

describe("assets picker", () => {
	it("combines all three types, tagged with type, no svg body", async () => {
		const r = await call("assets", "list", { search: `-${run}` }, "teacherA");
		const types = new Set(r.body.map((a) => a.type));
		expect(types).toEqual(new Set(["image", "audio", "svg"]));
		expect(r.body.every((a) => a.body === undefined)).toBe(true);
	});
});

describe("delete (super)", () => {
	it("svg delete → gone", async () => {
		expect((await call("svg", "delete", { slug: svg("bulk-b") }, "super")).status).toBe(200);
		expect((await call("svg", "get", { slug: svg("bulk-b") })).status).toBe(404);
	});

	it("image / audio delete works even when the file is not on disk", async () => {
		expect((await call("image", "delete", { slug: img }, "super")).status).toBe(200);
		expect((await call("audio", "delete", { slug: aud }, "super")).status).toBe(200);
		expect(await db.image.findUnique({ where: { slug: img } })).toBeNull();
	});
});