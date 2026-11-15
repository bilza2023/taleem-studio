// tests/contract.test.js
// 1) the whole new server loads  2) every contract entry is well-formed  3) the dispatcher's door is safe

import { describe, it, expect } from "vitest";
import { api } from "$lib/server/api.js";
import { request } from "$lib/server/dispatcher.js";

const LEVELS = ["public", "student", "admin", "teacher", "super"];

describe("contract", () => {
	it("api.js loads with all modules", () => {
		expect(Object.keys(api).length).toBe(16);
	});

	for (const [mod, methods] of Object.entries(api)) {
		for (const [name, entry] of Object.entries(methods)) {
			it(`${mod}.${name} is well-formed`, () => {
				expect(LEVELS).toContain(entry.access);
				expect(typeof entry.run).toBe("function");
				if (entry.access === "teacher") expect(typeof entry.course).toBe("function");
			});
		}
	}
});

describe("dispatcher door", () => {
	const status = async (call) => {
		try {
			await request(call);
			return 200;
		} catch (err) {
			return err.status ?? 500;
		}
	};

	it("unknown module → 404", async () => {
		expect(await status({ module: "nope", method: "get" })).toBe(404);
	});

	it("unknown method → 404", async () => {
		expect(await status({ module: "library", method: "nope" })).toBe(404);
	});

	it("inherited properties are not reachable → 404", async () => {
		expect(await status({ module: "constructor", method: "constructor" })).toBe(404);
		expect(await status({ module: "library", method: "toString" })).toBe(404);
	});

	it("non-object input → 400", async () => {
		expect(await status({ module: "rating", method: "options", data: [1, 2] })).toBe(400);
	});

	it("a public method works with no login", async () => {
		expect(await status({ module: "rating", method: "options" })).toBe(200);
	});
});