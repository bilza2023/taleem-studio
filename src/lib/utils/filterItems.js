// Pure functions — no UI, no URL.
// Items are expected to have `tags` already parsed into an array.

export function filterItems(items, { status = "", tag = "", search = "" } = {}) {
	let list = items ?? [];

	if (status) {
		list = list.filter((item) => item.status === status);
	}

	if (tag) {
		list = list.filter(
			(item) => Array.isArray(item.tags) && item.tags.includes(tag)
		);
	}

	const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

	if (words.length) {
		list = list.filter((item) => {
			const hay = `${item.title ?? ""} ${item.slug}`.toLowerCase();
			return words.every((w) => hay.includes(w));
		});
	}

	return list;
}

// Counts for the chip badges.
// Pass the items in the current scope (e.g. the selected group).
export function countItems(items) {
	const status = {};
	const tags = {};

	for (const item of items ?? []) {
		status[item.status] = (status[item.status] ?? 0) + 1;

		if (Array.isArray(item.tags)) {
			for (const t of item.tags) {
				tags[t] = (tags[t] ?? 0) + 1;
			}
		}
	}

	return { total: (items ?? []).length, status, tags };
}