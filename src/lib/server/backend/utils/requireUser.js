// /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/backend/utils/requireUser.js

import kernel from "taleem-kernel";

export async function requireUser(token) {
	if (!token) {
		const err = new Error("Authentication required.");
		err.status = 401;
		throw err;
	}

	try {
		return await kernel.user.authenticate(token);
	} catch {
		const err = new Error("Invalid or expired token.");
		err.status = 401;
		throw err;
	}
}