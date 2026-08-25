///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/edit/image/+server.js
import { json } from "@sveltejs/kit";
import { requireAdmin } from "$lib/server/auth/requireAdmin.js";
import {getImage,updateImage,deleteImage} from "$lib/server/image.js";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { config } from "$lib/config.js";


export async function GET({ request, url }) {
	try {
		await requireAdmin(request);

		const slug = url.searchParams.get("slug");

		if (!slug) {
			return json({ error: "Slug required" }, { status: 400 });
		}

		const image = await getImage(slug);

		if (!image) {
			return json({ error: "Image not found" }, { status: 404 });
		}

		return json(image);

	} catch (error) {
		console.error(error);
		return json({ error: error.message }, { status: 400 });
	}
}


export async function PUT({ request, url }) {
	try {
		await requireAdmin(request);

		const slug = url.searchParams.get("slug");

		if (!slug) {
			return json({ error: "Slug required" }, { status: 400 });
		}

		const data = await request.json();

		delete data.slug;
		delete data.createdAt;
		delete data.updatedAt;

		const image = await updateImage(slug, data);

		return json(image);

	} catch (error) {
		console.error(error);
		return json({ error: error.message }, { status: 400 });
	}
}


export async function DELETE({ request, url }) {
	try {
		await requireAdmin(request);

		const slug = url.searchParams.get("slug");

		if (!slug) {
			return json({ error: "Slug required" }, { status: 400 });
		}

		const filePath = path.resolve(config.imageDir, slug);

		await unlink(filePath);
		await deleteImage(slug);

		return json({ deleted: slug });

	} catch (error) {
		console.error(error);
		return json({ error: error.message }, { status: 400 });
	}
}