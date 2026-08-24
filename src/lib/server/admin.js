

// src/lib/server/admin.js

import kernel from "taleem-kernel";

export async function loginAdmin(email, password) {
	return kernel.admin.login(email, password);
}