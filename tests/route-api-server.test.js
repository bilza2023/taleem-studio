import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "$lib/server/db.js";
import { POST } from "../src/routes/api/server/+server.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
beforeAll(async () => { w = await createWorld(); });
afterAll(async () => { await destroyWorld(w); await db.$disconnect(); });

async function post(body, headers = {}) {
	const req = new Request("http://x/api/server", {
		method: "POST",
		headers: { "Content-Type": "application/json", ...headers },
		body: JSON.stringify(body)
	});
	const res = await POST({ request: req });
	return { status: res.status, body: await res.json() };
}

describe("api/server", () => {
	it("public call works with no token", async () => {
		const r = await post({ module: "rating", method: "options" });
		expect(r.status).toBe(200);
		expect(r.body.length).toBe(3);
	});

	it("student token in X-User-Token reaches the backend", async () => {
		const r = await post({ module: "user", method: "me" }, { "X-User-Token": w.actors.student.userToken });
		expect(r.body.email).toBe(w.student.email);
	});

	it("admin token in X-Admin-Token, and old Bearer, both work", async () => {
		const a = await post({ module: "admin", method: "me" }, { "X-Admin-Token": w.actors.super.adminToken });
		const b = await post({ module: "admin", method: "me" }, { Authorization: `Bearer ${w.actors.super.adminToken}` });
		expect(a.body.isSuper).toBe(true);
		expect(b.body.isSuper).toBe(true);
	});

	it("errors keep their real status and an { error } body", async () => {
		expect((await post({ module: "user", method: "me" })).status).toBe(401);
		expect((await post({ module: "course", method: "create", data: { slug: "x", title: "x" } }, { "X-Admin-Token": w.actors.teacherA.adminToken })).status).toBe(403);
		const r = await post({ module: "nope", method: "x" });
		expect(r.status).toBe(404);
		expect(typeof r.body.error).toBe("string");
	});
});