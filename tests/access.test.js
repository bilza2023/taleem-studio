// tests/access.test.js
// Every method × every actor: allowed, or refused with the right status (401 vs 403).

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { api } from "$lib/server/api.js";
import { buildContext, checkAccess } from "$lib/server/access.js";
import { db } from "$lib/server/db.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
beforeAll(async () => { w = await createWorld(); });
afterAll(async () => { await destroyWorld(w); await db.$disconnect(); });

// the rule table, written by hand — the test compares the code against THIS
// null = allowed; a number = the status the actor must get
const EXPECT = {
	public:  { anon: null, student: null, teacherA: null, teacherB: null, super: null },
	student: { anon: 401,  student: null, teacherA: 401,  teacherB: 401,  super: 401  },
	admin:   { anon: 401,  student: 401,  teacherA: null, teacherB: null, super: null },
	teacher: { anon: 401,  student: 401,  teacherA: null, teacherB: 403,  super: null },
	super:   { anon: 401,  student: 401,  teacherA: 403,  teacherB: 403,  super: null }
};

async function outcome(entry, actor) {
	const ctx = await buildContext(w.actors[actor]);
	try {
		await checkAccess(entry, { ...w.input }, ctx);
		return null;
	} catch (err) {
		return err.status ?? `crash: ${err.message}`;
	}
}

describe("access matrix", () => {
	for (const [mod, methods] of Object.entries(api)) {
		for (const [name, entry] of Object.entries(methods)) {
			it(`${mod}.${name} [${entry.access}]`, async () => {
				for (const actor of Object.keys(EXPECT[entry.access])) {
					const got = await outcome(entry, actor);
					expect(got, `${actor} on ${mod}.${name}`).toBe(EXPECT[entry.access][actor]);
				}
			});
		}
	}
});

describe("token rules", () => {
	it("an admin token in the student slot is not a student", async () => {
		const ctx = await buildContext({ userToken: w.actors.super.adminToken });
		expect(ctx.user).toBeNull();
		expect(ctx.badUserToken).toBe(true);
	});

	it("a student token in the admin slot is not an admin", async () => {
		const ctx = await buildContext({ adminToken: w.actors.student.userToken });
		expect(ctx.admin).toBeNull();
		expect(ctx.badAdminToken).toBe(true);
	});

	it("a garbage token is treated as anonymous, not a crash", async () => {
		const ctx = await buildContext({ userToken: "garbage", adminToken: "garbage" });
		expect(ctx.user).toBeNull();
		expect(ctx.admin).toBeNull();
	});

	it("an inactive admin is not an admin", async () => {
		const teacherA = w.admins[0];
		await db.admin.update({ where: { id: teacherA.id }, data: { isActive: false } });
		const ctx = await buildContext(w.actors.teacherA);
		expect(ctx.admin).toBeNull();
		await db.admin.update({ where: { id: teacherA.id }, data: { isActive: true } });
	});

	it("ctx never carries a password", async () => {
		const s = await buildContext(w.actors.student);
		const a = await buildContext(w.actors.super);
		expect(s.user.password).toBeUndefined();
		expect(a.admin.password).toBeUndefined();
	});

	it("a teacher with no-course inquiry is refused; super passes", async () => {
		const orphan = await db.inquiry.create({ data: { userId: w.student.id, message: "no course" } });
		const entry = api.inquiry.get;
		const tA = await buildContext(w.actors.teacherA);
		const sp = await buildContext(w.actors.super);

		await expect(checkAccess(entry, { id: orphan.id }, tA)).rejects.toMatchObject({ status: 403 });
		await expect(checkAccess(entry, { id: orphan.id }, sp)).resolves.toBeUndefined();

		await db.inquiry.delete({ where: { id: orphan.id } });
	});
});