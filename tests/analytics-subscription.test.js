// tests/analytics-subscription.test.js
// analytics.track / summary, mcqResult save/mine, subscription grant/stack/lifetime/revoke.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "$lib/server/dispatcher.js";
import { db } from "$lib/server/db.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const mcq = `t-mcq-${run}`;

async function call(module, method, data = {}, actor = "anon", tokens = null) {
	try {
		return { status: 200, body: await request({ module, method, data, ...(tokens ?? w.actors[actor]) }) };
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
	await db.library.create({ data: { slug: mcq, courseSlug: w.A, groupSlug: "g1", type: "MCQ", title: "Quiz", status: "PUBLISHED" } });
});

afterAll(async () => {
	await db.analyticsEvent.deleteMany({ where: { slug: { in: [w.lesson.slug, mcq] } } });
	await db.subscription.deleteMany({ where: { userId: w.student.id } });
	await db.library.deleteMany({ where: { slug: mcq } });
	await destroyWorld(w);
	await db.$disconnect();
});

describe("analytics.track", () => {
	it("bad event name → 400; unknown lesson → 404", async () => {
		expect((await call("analytics", "track", { name: "hack.me", slug: w.lesson.slug })).status).toBe(400);
		expect((await call("analytics", "track", { name: "lesson.open", slug: "nope" })).status).toBe(404);
	});

	it("records role from tokens: anon → null, student → student, both → admin", async () => {
		await call("analytics", "track", { name: "lesson.open", slug: w.lesson.slug, meta: { k: "anon" } });
		await call("analytics", "track", { name: "lesson.open", slug: w.lesson.slug, meta: { k: "stu" } }, "student");
		await call("analytics", "track", { name: "lesson.open", slug: w.lesson.slug, meta: { k: "both" } }, null,
			{ ...w.actors.student, ...w.actors.teacherA });

		const byMeta = (k) => waitFor(() => db.analyticsEvent.findFirst({ where: { slug: w.lesson.slug, meta: { contains: `"${k}"` } } }));
		expect((await byMeta("anon")).role).toBeNull();
		expect((await byMeta("stu")).role).toBe("student");
		expect((await byMeta("both")).role).toBe("admin");
	});

	it("summary lists every course, with opens counted", async () => {
		const r = await call("analytics", "summary", { days: 1 }, "super");
		const a = r.body.courses.find((c) => c.courseSlug === w.A);
		expect(a.opens.total).toBeGreaterThanOrEqual(3);
		expect(r.body.courses.find((c) => c.courseSlug === w.B)).toBeDefined(); // zero activity still listed
	});
});

describe("mcqResult", () => {
	it("anonymous: not saved, no error", async () => {
		const r = await call("mcqResult", "save", { slug: mcq, meta: { score: 1 } });
		expect(r.status).toBe(200);
		expect(r.body).toEqual({ saved: false, reason: "login" });
	});

	it("student: saved; non-MCQ → 404; too large → 413", async () => {
		const r = await call("mcqResult", "save", { slug: mcq, meta: { score: 7 } }, "student");
		expect(r.body.saved).toBe(true);
		expect((await call("mcqResult", "save", { slug: w.lesson.slug, meta: {} }, "student")).status).toBe(404);
		expect((await call("mcqResult", "save", { slug: mcq, meta: { big: "x".repeat(100_001) } }, "student")).status).toBe(413);
	});

	it("mine: anonymous → 401; student gets title + parsed report", async () => {
		expect((await call("mcqResult", "mine")).status).toBe(401);
		const r = await call("mcqResult", "mine", {}, "student");
		expect(r.body.items[0].title).toBe("Quiz");
		expect(r.body.items[0].report).toEqual({ score: 7 });
	});
});

describe("subscription", () => {
	const email = () => w.student.email;
	let firstId;

	it("validation: months, unknown student, unknown course", async () => {
		expect((await call("subscription", "grant", { userEmail: email(), courseSlug: w.B }, "super")).status).toBe(400);
		expect((await call("subscription", "grant", { userEmail: email(), courseSlug: w.B, months: 0 }, "super")).status).toBe(400);
		expect((await call("subscription", "grant", { userEmail: "ghost@t.local", courseSlug: w.B, months: 1 }, "super")).status).toBe(404);
		expect((await call("subscription", "grant", { userEmail: email(), courseSlug: "nope", months: 1 }, "super")).status).toBe(404);
	});

	it("grant 6 months → ends ~6 months from now", async () => {
		const r = await call("subscription", "grant", { userEmail: email(), courseSlug: w.B, months: 6, amount: 5000 }, "super");
		expect(r.status).toBe(200);
		firstId = r.body.id;
		const days = (new Date(r.body.endsAt) - new Date(r.body.startsAt)) / 86400000;
		expect(days).toBeGreaterThan(178);
		expect(days).toBeLessThan(186);
	});

	it("renewal stacks: next period starts when the current one ends", async () => {
		const first = await db.subscription.findUnique({ where: { id: firstId } });
		const r = await call("subscription", "grant", { userEmail: email(), courseSlug: w.B, months: 1 }, "super");
		expect(new Date(r.body.startsAt).getTime()).toBe(first.endsAt.getTime());
	});

	it("mine: active flag, no amounts", async () => {
		const r = await call("subscription", "mine", {}, "student");
		expect(r.body.length).toBe(2);
		expect(r.body.some((s) => s.active)).toBe(true);
		expect(r.body.every((s) => s.amount === undefined)).toBe(true);
		expect(r.body[0].course.title).toBe("Course B");
	});

	it("list: filter by email and active; includes student email", async () => {
		const r = await call("subscription", "list", { userEmail: email(), active: true }, "super");
		expect(r.body.length).toBe(1);
		expect(r.body[0].user.email).toBe(email());
	});

	it("revoke: cancels, keeps the row; twice → 409; unknown → 404", async () => {
		const r = await call("subscription", "revoke", { id: firstId }, "super");
		expect(r.body.cancelledAt).not.toBeNull();
		expect(await db.subscription.findUnique({ where: { id: firstId } })).not.toBeNull();
		expect((await call("subscription", "revoke", { id: firstId }, "super")).status).toBe(409);
		expect((await call("subscription", "revoke", { id: 99999999 }, "super")).status).toBe(404);
	});

	it("lifetime: endsAt null; any further grant → 409", async () => {
		const r = await call("subscription", "grant", { userEmail: email(), courseSlug: w.A, lifetime: true }, "super");
		expect(r.body.endsAt).toBeNull();
		expect((await call("subscription", "grant", { userEmail: email(), courseSlug: w.A, months: 1 }, "super")).status).toBe(409);
	});
});