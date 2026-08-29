import { requireAdminForCourse } from "./auth.js";
import { getCourse, getGroups, getGroupItems } from "./course.js";
import { getLibrary, listLibraryByGroup, createArticle, createPlayer } from "./library.js";

const ROLES = ["ARTICLE", "PLAYER"];

export async function getPending(request, courseSlug) {
	if (!courseSlug) throw new Error("Course is required");

	await requireAdminForCourse(request, courseSlug);

	const course = await getCourse(courseSlug);
	if (!course) throw new Error(`Course "${courseSlug}" not found.`);

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

	return { course, pending };
}

export async function createPendingContent(request, { courseSlug, groupSlug, slug, role }) {
	if (!courseSlug || !groupSlug || !slug || !role) {
		throw new Error("Course, group, slug and role are required");
	}

	role = role.toUpperCase();

	if (!ROLES.includes(role)) {
		throw new Error(`Invalid role: ${role}`);
	}

	await requireAdminForCourse(request, courseSlug);

	const existing = await getLibrary(slug);
	if (existing) {
		throw new Error(`Content already exists as ${existing.type}`);
	}

	const groupItems = await getGroupItems(courseSlug, groupSlug);
	if (!groupItems.includes(slug)) {
		throw new Error(`Item "${slug}" is not part of group "${groupSlug}"`);
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

	return role === "ARTICLE"
		? createArticle(data)
		: createPlayer(data);
}