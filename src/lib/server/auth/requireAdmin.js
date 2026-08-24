// src/lib/server/auth/requireAdmin.js

import kernel from "taleem-kernel";

export async function requireAdmin(request) {
	const auth = request.headers.get("authorization");

	if (!auth || !auth.startsWith("Bearer ")) {
		throw new Error("Authentication required.");
	}

	const token = auth.slice(7);

	return kernel.admin.authenticate(token);
}

export async function requireAdminForCourse(request, courseSlug) {
	const admin = await requireAdmin(request);

	const allowed = await kernel.admin.isAdmin(
		admin.email,
		courseSlug
	);

	if (!allowed) {
		throw new Error(
			`Admin is not authorized for course "${courseSlug}".`
		);
	}

	return admin;
}