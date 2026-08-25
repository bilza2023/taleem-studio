
// src/routes/edit/content/+server.js

import { json } from "@sveltejs/kit";
import { requireAdminForCourse } from "$lib/server/auth/requireAdmin.js";
import {
	getLibrary,
	updateLibrary,
	deleteLibrary
} from "$lib/server/library.js";
import {
	getCourse,
	getGroup,
	getGroupItems
} from "$lib/server/course.js";

const ROLES = ["ARTICLE", "PLAYER"];

export async function GET({ request, url }) {
	try {
		const slug = url.searchParams.get("slug");
		const courseSlug = url.searchParams.get("course");
		const groupSlug = url.searchParams.get("group");
		const role = url.searchParams.get("role")?.toUpperCase();

		if (!slug || !courseSlug || !groupSlug || !role) {
			return json(
				{ error: "Slug, course, group and role are required" },
				{ status: 400 }
			);
		}

		if (!ROLES.includes(role)) {
			return json(
				{ error: `Invalid role: ${role}` },
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

		const item = await getLibrary(slug);

		if (!item) {
			return json(
				{ error: `${role} not found` },
				{ status: 404 }
			);
		}

		if (
			item.courseSlug !== courseSlug ||
			item.groupSlug !== groupSlug
		) {
			return json(
				{ error: "Library item belongs to a different course or group" },
				{ status: 409 }
			);
		}

		if (item.type !== role) {
			return json(
				{ error: `Item already exists as ${item.type}` },
				{ status: 409 }
			);
		}

		return json(item);

	} catch (error) {
		console.error(error);
		return json(
			{ error: error.message },
			{ status: 400 }
		);
	}
}

export async function PUT({ request, url }) {
	try {
		const slug = url.searchParams.get("slug");
		const courseSlug = url.searchParams.get("course");
		const groupSlug = url.searchParams.get("group");
		const role = url.searchParams.get("role")?.toUpperCase();

		if (!slug || !courseSlug || !groupSlug || !role) {
			return json(
				{ error: "Slug, course, group and role are required" },
				{ status: 400 }
			);
		}

		if (!ROLES.includes(role)) {
			return json(
				{ error: `Invalid role: ${role}` },
				{ status: 400 }
			);
		}

		await requireAdminForCourse(request, courseSlug);

		const item = await getLibrary(slug);

		if (!item) {
			return json(
				{ error: `${role} not found` },
				{ status: 404 }
			);
		}

		if (
			item.courseSlug !== courseSlug ||
			item.groupSlug !== groupSlug ||
			item.type !== role
		) {
			return json(
				{ error: "Content identity does not match URL" },
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
		const role = url.searchParams.get("role")?.toUpperCase();

		if (!slug || !courseSlug || !groupSlug || !role) {
			return json(
				{ error: "Slug, course, group and role are required" },
				{ status: 400 }
			);
		}

		if (!ROLES.includes(role)) {
			return json(
				{ error: `Invalid role: ${role}` },
				{ status: 400 }
			);
		}

		await requireAdminForCourse(request, courseSlug);

		const item = await getLibrary(slug);

		if (!item) {
			return json(
				{ error: `${role} not found` },
				{ status: 404 }
			);
		}

		if (
			item.courseSlug !== courseSlug ||
			item.groupSlug !== groupSlug ||
			item.type !== role
		) {
			return json(
				{ error: "Content identity does not match URL" },
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