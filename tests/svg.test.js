// /home/bilal-tariq/00--TALEEM/taleem.studio/tests/svg.test.js

import { describe, it, expect, afterAll } from "vitest";
import kernel from "taleem-kernel";
import { request } from "../src/lib/server/server.js";

const runId = Date.now();
const courseSlug = `studio-svg-course-${runId}`;
const adminEmail = `studio-svg-admin-${runId}@example.com`;
const adminPassword = "test-password";

const slugA = `studio-svg-a-${runId}.svg`;
const slugB = `studio-svg-b-${runId}.svg`;
const slugExisting = `studio-svg-existing-${runId}.svg`;
const slugInvalid = `studio-svg-invalid-${runId}`; // no .svg on purpose

describe("Story: svg.bulkCreate via server.js dispatcher", () => {
	let token;

	it("seeds an admin and logs in to get a token", async () => {
		await kernel.admin.create({
			email: adminEmail,
			password: adminPassword,
			courseSlugs: JSON.stringify([courseSlug])
		});

		token = await request({
			module: "admin",
			method: "login",
			data: { email: adminEmail, password: adminPassword }
		});

		expect(typeof token).toBe("string");
	});

	it("bulk-creates new slugs and generates title from slug", async () => {
		const created = await request({
			module: "svg",
			method: "bulkCreate",
			data: { slugs: [slugA, slugB] },
			token
		});

		expect(created.length).toBe(2);

		const a = await kernel.svg.get(slugA);
		const b = await kernel.svg.get(slugB);

		expect(a).not.toBeNull();
		expect(b).not.toBeNull();
		expect(a.title).toBe(slugA.replace(/\.svg$/, "").replace(/-/g, " "));
		expect(a.body).toBe("");
	});

	it("rejects a batch containing an invalid slug and creates nothing", async () => {
		const invalidSlugName = `studio-svg-invalid2-${runId}`;

		await expect(
			request({
				module: "svg",
				method: "bulkCreate",
				data: { slugs: [invalidSlugName, slugInvalid] },
				token
			})
		).rejects.toThrow();

		const check = await kernel.svg.get(`${invalidSlugName}.svg`);
		expect(check).toBeNull();
	});

	it("rejects a batch where one slug already exists, and creates none of the new ones", async () => {
		await kernel.svg.create({
			slug: slugExisting,
			title: "pre-existing",
			body: "",
			tags: "[]"
		});

		const freshSlug = `studio-svg-fresh-${runId}.svg`;

		await expect(
			request({
				module: "svg",
				method: "bulkCreate",
				data: { slugs: [freshSlug, slugExisting] },
				token
			})
		).rejects.toThrow();

		const fresh = await kernel.svg.get(freshSlug);
		expect(fresh).toBeNull();
	});

	afterAll(async () => {
		await kernel.db.admin.delete({ where: { email: adminEmail } }).catch(() => {});

		for (const slug of [slugA, slugB, slugExisting]) {
			await kernel.db.svg.delete({ where: { slug } }).catch(() => {});
		}
	});

});