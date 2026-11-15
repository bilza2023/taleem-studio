import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "$lib/server/db.js";
import { POST } from "../src/routes/admin/timings/publish/+server.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const article = `t-pub-article-${run}`;

beforeAll(async () => {
	w = await createWorld();
	await db.library.create({ data: { slug: article, courseSlug: w.A, groupSlug: "g1", type: "ARTICLE", title: "x" } });
});
afterAll(async () => {
	await db.library.deleteMany({ where: { slug: article } });
	await destroyWorld(w);
	await db.$disconnect();
});

async function publish({ slug, withAudio = true }, actor) {
	const form = new FormData();
	if (slug !== undefined) form.set("slug", slug);
	if (withAudio) form.set("audio", new File(["x"], "rec.webm", { type: "audio/webm" }));
	const headers = actor ? { "X-Admin-Token": w.actors[actor].adminToken } : {};
	const res = await POST({ request: new Request("http://x/publish", { method: "POST", headers, body: form }) });
	return res.status;
}

describe("timings/publish — checks before encoding", () => {
	it("invalid slug → 400", async () => {
		expect(await publish({ slug: "bad slug!" }, "teacherA")).toBe(400);
	});

	it("no login → 401", async () => {
		expect(await publish({ slug: w.lesson.slug })).toBe(401);
	});

	it("teacher of another course → 403", async () => {
		expect(await publish({ slug: w.lesson.slug }, "teacherB")).toBe(403);
	});

	it("unknown lesson → 404", async () => {
		expect(await publish({ slug: `nope-${run}` }, "super")).toBe(404);
	});

	it("no audio → 400", async () => {
		expect(await publish({ slug: w.lesson.slug, withAudio: false }, "teacherA")).toBe(400);
	});

	it("not a PLAYER → 400", async () => {
		expect(await publish({ slug: article }, "teacherA")).toBe(400);
	});
});