import { json } from "@sveltejs/kit";
import kernel from "taleem-kernel";

export async function GET({ url }) {
	try {
		const slug = url.searchParams.get("slug");
		const courseSlug = url.searchParams.get("course");
		const groupSlug = url.searchParams.get("group");

		if (!slug || !courseSlug || !groupSlug) {
			return json(
				{ error: "Slug, course and group are required" },
				{ status: 400 }
			);
		}

		const course = await kernel.course.get(courseSlug);

		if (!course) {
			return json(
				{ error: `Course "${courseSlug}" not found` },
				{ status: 404 }
			);
		}

		const group = await kernel.course.getGroup(courseSlug, groupSlug);

		if (!group) {
			return json(
				{ error: `Group "${groupSlug}" not found` },
				{ status: 404 }
			);
		}

		const groupItems = await kernel.course.getGroupItems(courseSlug, groupSlug);

		if (!groupItems.includes(slug)) {
			return json(
				{ error: `Item "${slug}" is not part of group "${groupSlug}"` },
				{ status: 400 }
			);
		}

		let article = await kernel.library.get(slug);

		if (article) {
			if (
				article.courseSlug !== courseSlug ||
				article.groupSlug !== groupSlug
			) {
				return json(
					{ error: "Library item belongs to a different course or group" },
					{ status: 409 }
				);
			}

			if (article.type !== "ARTICLE") {
				return json(
					{ error: `Item already exists as ${article.type}` },
					{ status: 409 }
				);
			}

			return json(article);
		}

		article = await kernel.library.create({
			slug,
			title: "",
			description: "",
			thumbnail: "",
			type: "ARTICLE",
			body: "",
			courseSlug,
			groupSlug,
			sortOrder: 0,
			allowCommunication: true,
			meta: ""
		});

		return json(article, { status: 201 });
	} catch (error) {
		console.error(error);
		return json({ error: error.message }, { status: 500 });
	}
}

export async function PUT({ request, url }) {
	try {
		const slug = url.searchParams.get("slug");
		const courseSlug = url.searchParams.get("course");
		const groupSlug = url.searchParams.get("group");

		if (!slug || !courseSlug || !groupSlug) {
			return json(
				{ error: "Slug, course and group are required" },
				{ status: 400 }
			);
		}

		const article = await kernel.library.get(slug);

		if (!article) {
			return json({ error: "Article not found" }, { status: 404 });
		}

		if (
			article.courseSlug !== courseSlug ||
			article.groupSlug !== groupSlug ||
			article.type !== "ARTICLE"
		) {
			return json(
				{ error: "Article identity does not match URL" },
				{ status: 409 }
			);
		}

		const data = await request.json();

		delete data.slug;
		delete data.courseSlug;
		delete data.groupSlug;
		delete data.type;
		delete data.createdAt;
		delete data.updatedAt;

		const updated = await kernel.library.update(slug, data);

		return json(updated);
	} catch (error) {
		console.error(error);
		return json({ error: error.message }, { status: 400 });
	}
}