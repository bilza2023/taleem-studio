// tests/route-content.test.js
// /content/[...path]: svg from db (with and without .svg), files from disk, ../ blocked, missing → 404.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFile, unlink, mkdir } from "node:fs/promises";
import path from "node:path";
import { db } from "$lib/server/db.js";
import { config } from "$lib/config.js";
import { GET } from "../src/routes/content/[...path]/+server.js";

const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const withExt = `t-route-${run}.svg`;
const bare = `t-route-bare-${run}`; // an old-style row saved without .svg
const diskFile = `t-route-${run}.txt`;
const diskPath = path.join(path.resolve(config.contentDir), diskFile);

// SvelteKit's error() throws an object with .status; a Response means success
async function hit(p) {
	try {
		const res = await GET({ params: { path: p } });
		return {
			status: res.status,
			type: res.headers.get("Content-Type"),
			cache: res.headers.get("Cache-Control"),
			text: await res.text()
		};
	} catch (err) {
		return { status: err.status ?? 500 };
	}
}

beforeAll(async () => {
	await db.svg.create({ data: { slug: withExt, title: "x", body: "<svg>new</svg>" } });
	await db.svg.create({ data: { slug: bare, title: "x", body: "<svg>old</svg>" } });
	await mkdir(path.resolve(config.contentDir), { recursive: true });
	await writeFile(diskPath, "hello");
});

afterAll(async () => {
	await db.svg.deleteMany({ where: { slug: { in: [withExt, bare] } } });
	await unlink(diskPath).catch(() => {});
	await db.$disconnect();
});

describe("content route", () => {
	it("svg stored with .svg → served from db, no-cache", async () => {
		const r = await hit(`svg/${withExt}`);
		expect(r.status).toBe(200);
		expect(r.type).toBe("image/svg+xml");
		expect(r.cache).toBe("no-cache");
		expect(r.text).toBe("<svg>new</svg>");
	});

	it("old svg row stored without .svg → still served", async () => {
		const r = await hit(`svg/${bare}.svg`);
		expect(r.status).toBe(200);
		expect(r.text).toBe("<svg>old</svg>");
	});

	it("unknown svg → 404", async () => {
		expect((await hit(`svg/nope-${run}.svg`)).status).toBe(404);
	});

	it("file on disk → served with its bytes", async () => {
		const r = await hit(diskFile);
		expect(r.status).toBe(200);
		expect(r.text).toBe("hello");
		expect(r.type).toBe("application/octet-stream");
	});

	it("missing file → 404; empty path → 404", async () => {
		expect((await hit(`nope-${run}.png`)).status).toBe(404);
		expect((await hit("")).status).toBe(404);
	});

	it("../ cannot escape content/ → 403", async () => {
		expect((await hit("../package.json")).status).toBe(403);
	});
});