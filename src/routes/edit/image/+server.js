import { json } from "@sveltejs/kit";
import { mkdir, writeFile, access, unlink } from "node:fs/promises";
import path from "node:path";
import { requireAdmin } from "$lib/server/auth/requireAdmin.js";
import { createImage } from "$lib/server/image.js";

const IMAGE_DIR = "/root/taleem-studio/content/images";

export async function POST({ request }) {
	let filePath;

	try {
		await requireAdmin(request);

		const form = await request.formData();
		const file = form.get("file");

		if (!(file instanceof File)) {
			return json({ error: "Image file is required" }, { status: 400 });
		}

		if (!file.type.startsWith("image/")) {
			return json({ error: "File must be an image" }, { status: 400 });
		}

		const filename = path.basename(file.name);

		if (!filename) {
			return json({ error: "Invalid filename" }, { status: 400 });
		}

		filePath = path.join(IMAGE_DIR, filename);

		try {
			await access(filePath);
			return json(
				{ error: `File already exists: ${filename}` },
				{ status: 409 }
			);
		} catch {}

		await mkdir(IMAGE_DIR, { recursive: true });

		const buffer = Buffer.from(await file.arrayBuffer());
		await writeFile(filePath, buffer);

		const image = await createImage({
			slug: filename,
			title: form.get("title") || filename,
			tags: form.get("tags") || "[]"
		});

		return json(image, { status: 201 });

	} catch (error) {
		console.error(error);

		if (filePath) {
			try {
				await unlink(filePath);
			} catch {}
		}

		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}