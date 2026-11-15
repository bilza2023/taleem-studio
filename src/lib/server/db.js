// src/lib/server/db.js
// The one Prisma client for the whole server.

import { PrismaClient } from "@prisma/client";

// In dev, Vite hot-reload re-runs modules; reuse the client instead of opening a new connection each time.
const g = globalThis;

export const db = g.__taleemDb ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") g.__taleemDb = db;

export default db;