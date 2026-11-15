import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { access, unlink } from "node:fs/promises";
import path from "node:path";
import { db } from "$lib/server/db.js";
import { IMAGE_DIR, AUDIO_DIR } from "$lib/server/files/assetFiles.js";
import { POST } from "../src/routes/api/upload/+server.js";
import { createWorld, destroyWorld } from "./helpers/world.js";

let w;
const run = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const img = `t-up-${run}.png`;
const aud = `t-up-${run}.opus`;
const exists = (p) => access(p).then(() => true, () => false);

beforeAll(async () => { w = await createWorld(); });
afterAll(async () => {
	await db.image.deleteMany({ where: { slug: img } });
	await db.audio.deleteMany({ where: { slug: aud } });
	await unlink(path.join(IMAGE_DIR, img)).catch(() => {});
	await unlink(path.join(AUDIO_DIR, aud)).catch(() => {});
	await destroyWorld(w);
	await db.$disconnect();
});

async function upload({ type, name, mime, title, tags }, headers = {}) {
	const form = new FormData();
	if (type) form.set("type", type);
	if (name) form.set("file", new File(["data"], name, { type: mime }));
	if (title) form.set("title", title);
	if (tags) form.set("tags", JSON.stringify(tags));
	const res = await POST({ request: new Request("http://x/api/upload", { method: "POST", headers, body: form }) });
	return { status: res.status, body: await res.json() };
}

const asAdmin = () => ({ "X-Admin-Token": w.actors.teacherA.adminToken });

describe("api/upload", () => {
	it("no login → 401; student → 401", async () => {
		expect((await upload({ type: "image", name: img, mime: "image/png" })).status).toBe(401);
		expect((await upload({ type: "image", name: img, mime: "image/png" }, { "X-User-Token": w.actors.student.userToken })).status).toBe(401);
	});

	it("image: file saved + row created (201), tags as array", async () => {
		const r = await upload({ type: "image", name: img, mime: "image/png", title: "Pic", tags: ["a"] }, asAdmin());
		expect(r.status).toBe(201);
		expect(r.body.slug).toBe(img);
		expect(r.body.tags).toEqual(["a"]);
		expect(await exists(path.join(IMAGE_DIR, img))).toBe(true);
	});

	it("old Bearer header still works (audio)", async () => {
		const r = await upload({ type: "audio", name: aud, mime: "audio/ogg" }, { Authorization: `Bearer ${w.actors.teacherA.adminToken}` });
		expect(r.status).toBe(201);
		expect(await exists(path.join(AUDIO_DIR, aud))).toBe(true);
	});

	it("same file again → 409", async () => {
		expect((await upload({ type: "image", name: img, mime: "image/png" }, asAdmin())).status).toBe(409);
	});

	it("bad type → 400; wrong mime → 400; missing file → 400", async () => {
		expect((await upload({ type: "video", name: `v-${run}.mp4`, mime: "video/mp4" }, asAdmin())).status).toBe(400);
		expect((await upload({ type: "image", name: `t-x-${run}.pdf`, mime: "application/pdf" }, asAdmin())).status).toBe(400);
		expect((await upload({ type: "image" }, asAdmin())).status).toBe(400);
	});
});