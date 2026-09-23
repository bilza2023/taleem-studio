///home/bilal-tariq/00--TALEEM/taleem/scripts/set-group-thumbnails.js

import kernel from 'taleem-kernel';

const groupSlug = process.argv[2];
const thumbnail = process.argv[3];
const courseSlug = process.argv[4]; // optional, use if groupSlug isn't unique across courses

async function main() {
	if (!groupSlug || !thumbnail) {
		console.error('Usage: node scripts/set-group-thumbnails.js <groupSlug> <thumbnail> [courseSlug]');
		process.exit(1);
	}

	const filters = { groupSlug };
	if (courseSlug) filters.courseSlug = courseSlug;

	const items = await kernel.library.list(filters, { includeUnpublished: true });

	if (!items.length) {
		console.error(`No Library items found for groupSlug "${groupSlug}"${courseSlug ? ` (courseSlug "${courseSlug}")` : ''}.`);
		process.exit(1);
	}

	const updated = [];
	const failed = [];

	for (const item of items) {
		try {
			await kernel.library.update(item.slug, { thumbnail });
			updated.push(item.slug);
		} catch (err) {
			failed.push({ slug: item.slug, reason: err.message });
		}
	}

	console.log('─'.repeat(50));
	console.log(`Group "${groupSlug}"${courseSlug ? ` (course "${courseSlug}")` : ''} → thumbnail "${thumbnail}"`);
	if (updated.length) {
		console.log(`✅ updated (${updated.length}):`);
		updated.forEach((s) => console.log(`   ${s}`));
	}
	if (failed.length) {
		console.log(`❌ failed (${failed.length}):`);
		failed.forEach((f) => console.log(`   ${f.slug} — ${f.reason}`));
	}
	console.log('─'.repeat(50));
	console.log(`${updated.length} updated, ${failed.length} failed`);

	if (failed.length) process.exitCode = 1;
}

main()
	.catch(console.error)
	.finally(() => kernel.shutdown());