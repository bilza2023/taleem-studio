import kernel from "taleem-kernel";

export async function listCourses() {
	return kernel.course.list();
}

export async function getCourse(slug) {
	return kernel.course.get(slug);
}

export async function getGroups(slug) {
	return kernel.course.getGroups(slug);
}

export async function getGroup(slug, groupSlug) {
	return kernel.course.getGroup(slug, groupSlug);
}

export async function getGroupItems(slug, groupSlug) {
	return kernel.course.getGroupItems(slug, groupSlug);
}