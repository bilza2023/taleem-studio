// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/backend/utils/requireSuperAdmin.js

import kernel from "taleem-kernel";
import { requireAdmin } from "./requireAdmin.js";

export async function requireSuperAdmin(token) {
	const admin = await requireAdmin(token);

	const isSuper = await kernel.admin.isSuperAdmin(admin.email);

	if (!isSuper) {
		const err = new Error("Super admin access required.");
		err.status = 403;
		throw err;
	}

	return admin;
}