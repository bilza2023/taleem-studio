// src/lib/server/modules/user.js
// Student identity. Handlers never see tokens — ctx comes from access.js.

import { db } from "../db.js";
import { fail } from "../access.js";
import { hashPassword, checkPassword, makeUserToken } from "../auth.js";

function clean(user) {
	if (!user) return null;
	const { password, ...safe } = user;
	return safe;
}

function str(v) {
	return typeof v === "string" ? v.trim() : "";
}

// public — { email, password, name? } → user (no password)
export async function register(input) {
	const email = str(input.email);
	const password = typeof input.password === "string" ? input.password : "";
	const name = str(input.name) || null;

	if (!email || !email.includes("@")) fail(400, "A valid email is required.");
	if (password.length < 6) fail(400, "Password must be at least 6 characters.");

	try {
		const user = await db.user.create({
			data: { email, password: await hashPassword(password), name } // only known fields
		});
		return clean(user);
	} catch (err) {
		if (err.code === "P2002") fail(409, "This email is already registered.");
		throw err;
	}
}

// public — { email, password } → token
export async function login(input) {
	const email = str(input.email);
	const password = typeof input.password === "string" ? input.password : "";

	if (!email || !password) fail(400, "Email and password are required.");

	const user = await db.user.findUnique({ where: { email } });
	const ok = user ? await checkPassword(password, user.password) : false;

	// same message for "no such user" and "wrong password" — don't reveal which emails exist
	if (!ok) fail(401, "Invalid email or password.");

	return makeUserToken(user);
}

// student — {} → current user
export async function me(input, ctx) {
	return ctx.user; // already loaded and password-stripped by access.js
}