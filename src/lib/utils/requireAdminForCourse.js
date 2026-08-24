
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
// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/utils/requireAdmin.js

import kernel from "taleem-kernel";

export async function requireAdmin(request) {
	const auth = request.headers.get("authorization");

	if (!auth || !auth.startsWith("Bearer ")) {
		throw new Error("Authentication required");
	}

	const token = auth.slice(7);

	try {
		return await kernel.admin.authenticate(token);
	} catch (error) {
		throw new Error(error.message || "Admin authentication failed");
	}
}
