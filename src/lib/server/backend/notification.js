// src/lib/server/backend/notification.js
import kernel from "../../taleem-kernel";
import { requireAdmin, isSuper, assertCourse, fail } from "./guards.js";

// APP (everyone) → super only; COURSE → own course; USER → any admin
function assertAudience(admin, data) {
	if (data.audience === "APP" && !isSuper(admin)) throw fail("Only super admin can post to everyone.", 403);
	if (data.audience === "COURSE") assertCourse(admin, data.courseSlug);
}

export async function listNotifications(data, token) {
	const admin = await requireAdmin(token);
	if (!isSuper(admin)) assertCourse(admin, data.courseSlug);
	return kernel.notification.listPage(
		{ audience: data.audience, courseSlug: data.courseSlug },
		{ page: data.page, pageSize: data.pageSize }
	);
}

export async function createNotification(data, token) {
	const admin = await requireAdmin(token);
	assertAudience(admin, data);
	return kernel.notification.create({
		audience: data.audience,
		courseSlug: data.courseSlug,
		userId: data.userId ? Number(data.userId) : null,
		title: data.title,
		body: data.body,
		link: data.link,
		publishAt: data.publishAt,
		expiresAt: data.expiresAt,
		createdBy: admin.email
	});
}

export async function deleteNotification(data, token) {
	const admin = await requireAdmin(token);
	const id = Number(data.id);
	const n = await kernel.db.notification.findUnique({ where: { id } });
	if (!n) throw fail("Notification not found.", 404);
	if (!isSuper(admin)) {
		if (n.audience !== "COURSE") throw fail("Only super admin can delete this.", 403);
		assertCourse(admin, n.courseSlug);
	}
	return kernel.notification.delete(id);
}