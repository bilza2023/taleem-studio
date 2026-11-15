// src/lib/server/modules/subscription.js
// Paid access. "Active" = started, not cancelled, endsAt empty (lifetime) or in the future.

import { db } from "../db.js";
import { fail } from "../access.js";

const str = (v) => (typeof v === "string" ? v.trim() : "");

// ── data (used by library + hub) ──────────────────────────

function activeWhere(now = new Date()) {
	return { startsAt: { lte: now }, cancelledAt: null, OR: [{ endsAt: null }, { endsAt: { gte: now } }] };
}

export async function hasActiveSubscription(userId, courseSlug) {
	return !!(await db.subscription.findFirst({ where: { userId, courseSlug, ...activeWhere() } }));
}

// course slugs this student can currently use
export async function activeCourses(userId) {
	const rows = await db.subscription.findMany({ where: { userId, ...activeWhere() }, select: { courseSlug: true } });
	return [...new Set(rows.map((r) => r.courseSlug))];
}

function isActive(s, now = new Date()) {
	return s.startsAt <= now && !s.cancelledAt && (s.endsAt === null || s.endsAt >= now);
}

function addMonths(date, months) {
	const d = new Date(date);
	d.setMonth(d.getMonth() + months);
	return d;
}

// ── api ───────────────────────────────────────────────────

// student — {} → my subscriptions, newest first, each with course title + active flag
export async function mine(input, ctx) {
	const rows = await db.subscription.findMany({
		where: { userId: ctx.user.id },
		include: { course: { select: { slug: true, title: true } } },
		orderBy: { startsAt: "desc" }
	});
	const now = new Date();
	return rows.map(({ amount, ...s }) => ({ ...s, active: isActive(s, now) })); // students don't see amounts
}

// super — { courseSlug?, userEmail?, active? } → subscriptions with student email/name
export async function list(input) {
	const where = {};
	if (input.courseSlug) where.courseSlug = str(input.courseSlug);
	if (input.userEmail) {
		const user = await db.user.findUnique({ where: { email: str(input.userEmail) } });
		if (!user) return [];
		where.userId = user.id;
	}

	const rows = await db.subscription.findMany({
		where,
		include: { user: { select: { id: true, email: true, name: true } } },
		orderBy: { startsAt: "desc" }
	});

	const now = new Date();
	const out = rows.map((s) => ({ ...s, active: isActive(s, now) }));
	if (typeof input.active === "boolean") return out.filter((s) => s.active === input.active);
	return out;
}

// super — { userEmail, courseSlug, months | lifetime: true, amount? } → new subscription row
// renewal stacks: a new period starts when the student's current active period ends
export async function grant(input) {
	const userEmail = str(input.userEmail);
	const courseSlug = str(input.courseSlug);
	const lifetime = input.lifetime === true;
	const months = Number(input.months);

	if (!userEmail) fail(400, "userEmail is required.");
	if (!courseSlug) fail(400, "courseSlug is required.");
	if (!lifetime && (!Number.isInteger(months) || months < 1 || months > 36)) {
		fail(400, "months must be a whole number 1–36 (or set lifetime: true).");
	}

	const user = await db.user.findUnique({ where: { email: userEmail } });
	if (!user) fail(404, `No student with email "${userEmail}".`);
	if (!(await db.course.findUnique({ where: { slug: courseSlug } }))) fail(404, `Course "${courseSlug}" not found.`);

	const amount = input.amount === undefined || input.amount === null ? null : Number(input.amount);
	if (amount !== null && (!Number.isInteger(amount) || amount < 0)) fail(400, "amount must be a whole number ≥ 0.");

	const now = new Date();
	const current = await db.subscription.findMany({
		where: { userId: user.id, courseSlug, cancelledAt: null },
		orderBy: { startsAt: "desc" }
	});
	const active = current.filter((s) => isActive(s, now) || s.startsAt > now);
	if (active.some((s) => s.endsAt === null)) fail(409, "Student already has lifetime access to this course.");

	const lastEnd = active.reduce((max, s) => (s.endsAt > max ? s.endsAt : max), now);
	const startsAt = lastEnd > now ? lastEnd : now;
	const endsAt = lifetime ? null : addMonths(startsAt, months);

	return db.subscription.create({ data: { userId: user.id, courseSlug, startsAt, endsAt, amount } });
}

// super — { id } → subscription (cancelled, row kept as the payment record)
export async function revoke(input) {
	const id = Number(input.id);
	if (!Number.isInteger(id) || id < 1) fail(400, "id is required.");
	const row = await db.subscription.findUnique({ where: { id } });
	if (!row) fail(404, "Subscription not found.");
	if (row.cancelledAt) fail(409, "Already cancelled.");
	return db.subscription.update({ where: { id }, data: { cancelledAt: new Date() } });
}