// /home/bilal-tariq/00--TALEEM/taleem/scripts/bulk-groups.js
// Usage: edit the two variables below, then run
//   node scripts/bulk-groups.js

import kernel from 'taleem-kernel';

// ════════════════════════════════════════════════
// EDIT HERE
// ════════════════════════════════════════════════

const COURSE_SLUG = 'fbise9math';

const GROUPS = [
	{ slug: "6.2",       title: "Exercise 6.2" },
	{ slug: "6.3",       title: "Exercise 6.3" },
	{ slug: "6.4",       title: "Exercise 6.4" },
	{ slug: "6.5",       title: "Exercise 6.5" },
	{ slug: "6.6",       title: "Exercise 6.6" },
	{ slug: "ch6-misc",  title: "Miscellaneous Exercise 6" },
	{ slug: "ch6-intro", title: "Chapter 6 Introduction" },
];

// ════════════════════════════════════════════════

const ALLOWED_FIELDS = ['slug', 'title', 'thumbnail', 'description'];

async function main() {
	if (!COURSE_SLUG || !Array.isArray(GROUPS) || !GROUPS.length) {
		console.error('Set COURSE_SLUG and a non-empty GROUPS array at the top of the script.');
		process.exit(1);
	}

	// Fail once, up front, instead of N identical FK errors
	const course = await kernel.course.get(COURSE_SLUG);
	if (!course) {
		console.error(`Course "${COURSE_SLUG}" not found.`);
		process.exit(1);
	}

	const created = [];
	const skipped = [];
	const failed = [];
	const seen = new Set();

	for (const group of GROUPS) {
		const { slug, title } = group ?? {};

		if (!slug || !title) {
			failed.push({ slug: slug ?? '(missing)', reason: 'missing slug or title' });
			continue;
		}

		if (seen.has(slug)) {
			failed.push({ slug, reason: 'duplicate slug in GROUPS' });
			continue;
		}
		seen.add(slug);

		// Whitelist fields; courseSlug always comes from COURSE_SLUG
		const data = { courseSlug: COURSE_SLUG };
		for (const key of ALLOWED_FIELDS) {
			if (group[key] !== undefined) data[key] = group[key];
		}

		try {
			await kernel.group.create(data);
			created.push(slug);
		} catch (err) {
			// P2002 = unique (courseSlug, slug) already exists → safe re-runs
			if (err.code === 'P2002') {
				skipped.push(slug);
			} else {
				failed.push({ slug, reason: err.message });
			}
		}
	}

	console.log('─'.repeat(50));
	console.log(`Course "${COURSE_SLUG}"`);
	if (created.length) {
		console.log(`✅ created (${created.length}):`);
		created.forEach((s) => console.log(`   ${s}`));
	}
	if (skipped.length) {
		console.log(`⏭  skipped — already exists (${skipped.length}):`);
		skipped.forEach((s) => console.log(`   ${s}`));
	}
	if (failed.length) {
		console.log(`❌ failed (${failed.length}):`);
		failed.forEach((f) => console.log(`   ${f.slug} — ${f.reason}`));
	}
	console.log('─'.repeat(50));
	console.log(`${created.length} created, ${skipped.length} skipped, ${failed.length} failed`);

	if (failed.length) process.exitCode = 1;
}

main()
	.catch(console.error)
	.finally(() => kernel.shutdown());