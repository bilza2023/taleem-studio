///home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/server/backend/svg.js
import kernel from 'taleem-kernel';
import { requireAdmin } from './utils/requireAdmin.js';
import { requireSuperAdmin } from './utils/requireSuperAdmin.js';

function isValidSvgSlug(slug) {
	return typeof slug === "string" && slug.trim().endsWith(".svg") && slug.trim().length > 4;
}

function slugToTitle(slug) {
	return slug.replace(/\.svg$/, "").replace(/-/g, " ");
}

export async function createSvg(data, token) {
	await requireAdmin(token);

	const slug = data.slug?.endsWith('.svg')
		? data.slug
		: `${data.slug}.svg`;

	return kernel.svg.create({ ...data, slug });
}

export async function getSvg(slug) {
	return kernel.svg.get(slug);
}

export async function listSvg(filters) {
	return kernel.svg.list(filters);
}

export async function updateSvg(slug, data, token) {
	await requireAdmin(token);
	return kernel.svg.update(slug, data);
}

export async function deleteSvg(slug, token) {
	await requireSuperAdmin(token);
	return kernel.svg.delete(slug);
}
export async function bulkCreateSvgs(slugs, token) {
	await requireAdmin(token);

	const trimmed = (slugs || []).map(s => s.trim()).filter(Boolean);

	const invalid = trimmed.filter(s => !isValidSvgSlug(s));

	if (invalid.length) {
		const err = new Error(`Invalid slug(s) — must end with ".svg": ${invalid.join(", ")}`);
		err.status = 400;
		throw err;
	}

	const existing = [];

	for (const slug of trimmed) {
		const found = await kernel.svg.get(slug);
		if (found) existing.push(slug);
	}

	if (existing.length) {
		const err = new Error(`Slug(s) already exist, no records created: ${existing.join(", ")}`);
		err.status = 409;
		throw err;
	}

	const created = [];

	for (const slug of trimmed) {
		const svg = await createSvg({
			slug,
			title: slugToTitle(slug),
			body: "",
			tags: "[]"
		}, token);

		created.push(svg);
	}

	return created;
}

export async function listSvgPaginated(page = 1, pageSize = 50) {
	const all = await kernel.svg.list();

	const sorted = [...all].sort(
		(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
	);

	const total = sorted.length;
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const start = (safePage - 1) * pageSize;

	return {
		items: sorted.slice(start, start + pageSize),
		total,
		page: safePage,
		pageSize,
		totalPages
	};
}