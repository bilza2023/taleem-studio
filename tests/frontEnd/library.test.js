import { describe, it, expect, vi } from "vitest";

vi.mock("./http/http.js", () => ({
	http: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn()
	}
}));

import { http } from "../../src/lib/frontEnd/http/http.js";
import { getLibrary } from "../../src/lib/frontEnd/library.js";

describe("FrontEnd.library", () => {
	it("getLibrary calls HTTP GET", async () => {
		http.get.mockResolvedValue({ slug: "lesson-1" });

		const result = await getLibrary("lesson-1");

		expect(http.get).toHaveBeenCalledWith("/library/lesson-1");
		expect(result).toEqual({ slug: "lesson-1" });
	});
});