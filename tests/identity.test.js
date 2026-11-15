// tests/identity.test.js
// user + admin: register, login, me, admin management, lock-out guard.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "$lib/server/dispatcher.js";
import { db } from "$lib/server/db.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const studentEmail = `t-reg-${run}@test.local`;
const newAdminEmail = `t-newadmin-${run}@test.local`;

beforeAll(async () => { w = await createWorld(); });
afterAll(async () => {
	await db.user.deleteMany({ where: { email: studentEmail } });
	await db.admin.deleteMany({ where: { email: newAdminEmail } });
	await destroyWorld(w);
	await db.$disconnect();
});

// call like a page would; returns { status, body }
async function call(module, method, data = {}, actor = "anon") {
	try {
		const body = await request({ module, method, data, ...w.actors[actor] });
		return { status: 200, body };
	} catch (err) {
		return { status: err.status ?? 500, body: err.message };
	}
}

describe("user", () => {
	it("register → user without password", async () => {
		const r = await call("user", "register", { email: studentEmail, password: "secret1", name: "Test" });
		expect(r.status).toBe(200);
		expect(r.body.email).toBe(studentEmail);
		expect(r.body.password).toBeUndefined();
	});

	it("register only stores known fields (id from input is ignored)", async () => {
		const row = await db.user.findUnique({ where: { email: studentEmail } });
		expect(row.id).not.toBe(999999);
	});

	it("register duplicate → 409", async () => {
		expect((await call("user", "register", { email: studentEmail, password: "secret1" })).status).toBe(409);
	});

	it("register short password → 400", async () => {
		expect((await call("user", "register", { email: `x-${run}@t.local`, password: "123" })).status).toBe(400);
	});

	it("login → token; wrong password and unknown email both → 401 with the same message", async () => {
		const ok = await call("user", "login", { email: studentEmail, password: "secret1" });
		expect(ok.status).toBe(200);
		expect(typeof ok.body).toBe("string");

		const wrong = await call("user", "login", { email: studentEmail, password: "nope99" });
		const unknown = await call("user", "login", { email: `ghost-${run}@t.local`, password: "nope99" });
		expect(wrong.status).toBe(401);
		expect(unknown.status).toBe(401);
		expect(wrong.body).toBe(unknown.body); // doesn't reveal which emails exist
	});

	it("the login token works as a student token", async () => {
		const { body: token } = await call("user", "login", { email: studentEmail, password: "secret1" });
		const me = await request({ module: "user", method: "me", userToken: token });
		expect(me.email).toBe(studentEmail);
		expect(me.password).toBeUndefined();
	});
});

describe("admin identity", () => {
	it("admin.me → courseSlugs is an array, isSuper is set", async () => {
		const t = await call("admin", "me", {}, "teacherA");
		expect(t.status).toBe(200);
		expect(t.body.courseSlugs).toEqual([w.A]);
		expect(t.body.isSuper).toBe(false);
		expect(t.body.password).toBeUndefined();

		const s = await call("admin", "me", {}, "super");
		expect(s.body.isSuper).toBe(true);
	});

	it("admin.login wrong password → 401", async () => {
		expect((await call("admin", "login", { email: w.admins[0].email, password: "wrong" })).status).toBe(401);
	});
});

describe("admin management (super)", () => {
	it("create → admin with courseSlugs array, no password", async () => {
		const r = await call("admin", "create", { email: newAdminEmail, password: "secret1", courseSlugs: [w.A] }, "super");
		expect(r.status).toBe(200);
		expect(r.body.courseSlugs).toEqual([w.A]);
		expect(r.body.role).toBe("ADMIN");
		expect(r.body.password).toBeUndefined();
	});

	it("create duplicate → 409; bad role → 400", async () => {
		expect((await call("admin", "create", { email: newAdminEmail, password: "secret1" }, "super")).status).toBe(409);
		expect((await call("admin", "create", { email: `r-${run}@t.local`, password: "secret1", role: "KING" }, "super")).status).toBe(400);
	});

	it("the new admin can log in", async () => {
		expect((await call("admin", "login", { email: newAdminEmail, password: "secret1" })).status).toBe(200);
	});

	it("update ignores unknown fields (email cannot be changed)", async () => {
		const r = await call("admin", "update", { email: newAdminEmail, changes: { email: "hijack@t.local", isActive: true } }, "super");
		expect(r.status).toBe(200);
		expect(r.body.email).toBe(newAdminEmail);
	});

	it("update with nothing valid → 400; unknown admin → 404", async () => {
		expect((await call("admin", "update", { email: newAdminEmail, changes: { foo: 1 } }, "super")).status).toBe(400);
		expect((await call("admin", "update", { email: `ghost-${run}@t.local`, changes: { isActive: true } }, "super")).status).toBe(404);
	});

	it("assignCourse / unassignCourse; unknown course → 404", async () => {
		const a = await call("admin", "assignCourse", { email: newAdminEmail, courseSlug: w.B }, "super");
		expect(a.body.courseSlugs).toEqual([w.A, w.B]);

		const u = await call("admin", "unassignCourse", { email: newAdminEmail, courseSlug: w.A }, "super");
		expect(u.body.courseSlugs).toEqual([w.B]);

		expect((await call("admin", "assignCourse", { email: newAdminEmail, courseSlug: "no-such-course" }, "super")).status).toBe(404);
	});

	it("lock-out guard: super cannot demote, deactivate or delete self", async () => {
		const me = w.admins[2].email;
		expect((await call("admin", "update", { email: me, changes: { role: "ADMIN" } }, "super")).status).toBe(400);
		expect((await call("admin", "update", { email: me, changes: { isActive: false } }, "super")).status).toBe(400);
		expect((await call("admin", "delete", { email: me }, "super")).status).toBe(400);
	});

	it("list never returns passwords", async () => {
		const r = await call("admin", "list", {}, "super");
		expect(r.status).toBe(200);
		expect(r.body.every((a) => a.password === undefined)).toBe(true);
	});

	it("delete → ok; deleted admin can no longer log in", async () => {
		expect((await call("admin", "delete", { email: newAdminEmail }, "super")).status).toBe(200);
		expect((await call("admin", "login", { email: newAdminEmail, password: "secret1" })).status).toBe(401);
	});
});