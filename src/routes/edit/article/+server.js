///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/edit/article/+server.js
import { json } from "@sveltejs/kit";
import { requireAdminForCourse } from "$lib/server/auth/requireAdmin.js";
import {
	getLibrary,
	createArticle,
	updateLibrary,
	deleteLibrary
} from "$lib/server/library.js";
import {
	getCourse,
	getGroup,
	getGroupItems
} from "$lib/server/course.js";

export async function GET({ request, url }) {
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

		await requireAdminForCourse(request, courseSlug);

		const course = await getCourse(courseSlug);

		if (!course) {
			return json(
				{ error: `Course "${courseSlug}" not found` },
				{ status: 404 }
			);
		}

		const group = await getGroup(courseSlug, groupSlug);

		if (!group) {
			return json(
				{ error: `Group "${groupSlug}" not found` },
				{ status: 404 }
			);
		}

		const groupItems = await getGroupItems(courseSlug, groupSlug);

		if (!groupItems.includes(slug)) {
			return json(
				{ error: `Item "${slug}" is not part of group "${groupSlug}"` },
				{ status: 400 }
			);
		}

		let article = await getLibrary(slug);

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

		article = await createArticle({
			slug,
			title: "",
			description: "",
			thumbnail: "",
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

		return json(
			{ error: error.message },
			{ status: 500 }
		);
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

		await requireAdminForCourse(request, courseSlug);

		const article = await getLibrary(slug);

		if (!article) {
			return json(
				{ error: "Article not found" },
				{ status: 404 }
			);
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

		const updated = await updateLibrary(slug, data);

		return json(updated);

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}

export async function DELETE({ request, url }) {
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

		await requireAdminForCourse(request, courseSlug);

		const article = await getLibrary(slug);

		if (!article) {
			return json(
				{ error: "Article not found" },
				{ status: 404 }
			);
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

		await deleteLibrary(slug);

		return json({ deleted: slug });

	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}