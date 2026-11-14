// src/lib/server/backend/inquiry.js
import kernel from "../../taleem-kernel";
import { requireStudent, requireAdmin, isSuper, adminCourses, assertCourse, fail } from "./guards.js";

const WEEKLY_LIMIT = 2;
const MESSAGE_MAX = 1000;
const STATUSES = ["OPEN", "ANSWERED", "CLOSED"];

// ── student ──────────────────────────────────────────────
export async function createInquiry(data, token) {
	const user = await requireStudent(token);

	const message = (data.message ?? "").toString().trim().slice(0, MESSAGE_MAX);
	if (!message) throw fail("Write a message first.");

	const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
	const sent = await kernel.inquiry.countSince(user.id, weekAgo);
	if (sent >= WEEKLY_LIMIT) {
		throw fail(`You can send ${WEEKLY_LIMIT} messages a week. Please try again in a few days.`, 429);
	}

	// optional course context — must be a real course
	let courseSlug = null;
	if (data.courseSlug) {
		const course = await kernel.course.get(data.courseSlug);
		if (course) courseSlug = course.slug;
	}

	return kernel.inquiry.create({ userId: user.id, message, courseSlug });
}

export async function myInquiries(data, token) {
	const user = await requireStudent(token);
	return kernel.inquiry.listForUser(user.id, { limit: data.limit ?? 20 });
}

export async function markMyRepliesRead(data, token) {
	const user = await requireStudent(token);
	await kernel.inquiry.markRepliesRead(user.id);
	return { ok: true };
}

// ── admin ────────────────────────────────────────────────
// super: everything (incl. no-course inquiries); teacher: own courses only
export async function listInquiries(data, token) {
	const admin = await requireAdmin(token);
	if (!isSuper(admin)) assertCourse(admin, data.courseSlug);

	return kernel.inquiry.listPage(
		{ status: data.status, courseSlug: data.courseSlug, tag: data.tag },
		{ page: data.page, pageSize: data.pageSize }
	);
}

async function loadForAdmin(id, admin) {
	const inquiry = await kernel.inquiry.get(Number(id));
	if (!inquiry) throw fail("Inquiry not found.", 404);
	if (!isSuper(admin)) assertCourse(admin, inquiry.courseSlug); // null course → super only
	return inquiry;
}

export async function getInquiry(data, token) {
	const admin = await requireAdmin(token);
	return loadForAdmin(data.id, admin);
}

export async function replyInquiry(data, token) {
	const admin = await requireAdmin(token);
	await loadForAdmin(data.id, admin);
	return kernel.inquiry.reply(Number(data.id), { reply: data.reply, repliedBy: admin.email });
}

export async function setInquiryStatus(data, token) {
	const admin = await requireAdmin(token);
	if (!STATUSES.includes(data.status)) throw fail("Invalid status.");
	await loadForAdmin(data.id, admin);
	return kernel.inquiry.setStatus(Number(data.id), data.status);
}

export async function setInquiryTags(data, token) {
	const admin = await requireAdmin(token);
	await loadForAdmin(data.id, admin);
	return kernel.inquiry.setTags(Number(data.id), data.tags);
}

export { adminCourses };