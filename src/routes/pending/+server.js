import { json } from "@sveltejs/kit";
import { requireAdminForCourse } from "$lib/server/auth/requireAdmin.js";
import {
	getCourse,
	getGroups,
	getGroup,
	getGroupItems
} from "$lib/server/course.js";
import {
	getLibrary,
	listLibraryByGroup,
	createArticle,
	createPlayer
} from "$lib/server/library.js";

export async function GET({ request, url }) {
	try {
		const courseSlug = url.searchParams.get("course");

		if (!courseSlug) {
			return json({ error: "Course is required" }, { status: 400 });
		}

		await requireAdminForCourse(request, courseSlug);

		const course = await getCourse(courseSlug);

		if (!course) {
			return json({ error: `Course "${courseSlug}" not found.` }, { status: 404 });
		}

		const groups = await getGroups(courseSlug);
		const pending = [];

		for (const group of groups) {
			const itemSlugs = await getGroupItems(courseSlug, group.slug);
			const libraryItems = await listLibraryByGroup(courseSlug, group.slug);
			const existing = new Set(libraryItems.map(item => item.slug));

			for (const slug of itemSlugs) {
				if (!existing.has(slug)) {
					pending.push({
						slug,
						groupSlug: group.slug,
						groupTitle: group.title
					});
				}
			}
		}

		return json({ course, pending });

	} catch (error) {
		console.error(error);
		return json({ error: error.message }, { status: 500 });
	}
}


export async function POST({ request, url }) {
	try {
		const courseSlug = url.searchParams.get("course");
		const groupSlug = url.searchParams.get("group");
		const slug = url.searchParams.get("slug");
		const role = url.searchParams.get("role")?.toUpperCase();

		if (!courseSlug || !groupSlug || !slug || !role) {
			return json(
				{ error: "Course, group, slug and role are required" },
				{ status: 400 }
			);
		}

		if (!["ARTICLE", "PLAYER"].includes(role)) {
			return json({ error: `Invalid role: ${role}` }, { status: 400 });
		}

		await requireAdminForCourse(request, courseSlug);

		const existing = await getLibrary(slug);

		if (existing) {
			return json(
				{ error: `Content already exists as ${existing.type}` },
				{ status: 409 }
			);
		}

		const groupItems = await getGroupItems(courseSlug, groupSlug);

		if (!groupItems.includes(slug)) {
			return json(
				{ error: `Item "${slug}" is not part of group "${groupSlug}"` },
				{ status: 400 }
			);
		}

		const data = {
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
		};

		const item = role === "ARTICLE"
			? await createArticle(data)
			: await createPlayer(data);

		return json(item, { status: 201 });

	} catch (error) {
		console.error(error);
		return json({ error: error.message }, { status: 400 });
	}
}