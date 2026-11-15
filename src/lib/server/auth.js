// src/lib/server/auth.js
// Passwords + login tokens. Payload shapes and secret match the old kernel exactly,
// so tokens already in localStorage stay valid.

import "dotenv/config"; // loads .env into process.env (same as the old Config.js did)
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("auth.js: JWT_SECRET is not set (check .env).");

// ── tokens ───────────────────────────────────────────────
export const signToken = (payload) => jwt.sign(payload, secret);
export const verifyToken = (token) => jwt.verify(token, secret); // throws if invalid

export const makeAdminToken = (admin) => signToken({ email: admin.email, type: "admin" });
export const makeUserToken = (user) => signToken({ id: user.id, type: "user" });

// ── passwords ────────────────────────────────────────────
export const hashPassword = (plain) => bcrypt.hash(plain, 10);
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash);