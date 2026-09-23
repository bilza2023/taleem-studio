
// /home/bilal-tariq/00--TALEEM/taleem/scripts/library-set-field.js
// Usage: edit the variables below, then run
//   node scripts/library-set-field.js
// Runs as a dry run until APPLY = true.

import kernel from 'taleem-kernel';

// ════════════════════════════════════════════════
// EDIT HERE
// ════════════════════════════════════════════════

const COURSE_SLUG = 'fbise9math';

const GROUPS = ['5.1', '5.2', '5.3' ,'5.4', 'ch5-misc'];

const FIELD = 'thumbnail';
const VALUE = 'blog.svg';

const TYPE = 'PLAYER';   // 'PLAYER' | 'ARTICLE' | null (null = all types)

const APPLY = false;     // false = preview only, true = write

// ════════════════════════════════════════════════

const ALLOWED_FIELDS = ['thumbnail', 'description', 'allowCommunication'];

async function main() {
	if (!COURSE_SLUG || !Array.isArray(GROUPS) || !GROUPS.length) {
		console.error('Set COURSE_SLUG and a non-empty GROUPS array at the top of the script.');
		process.exit(1);
	}

	if (!ALLOWED_FIELDS.includes(FIELD)) {
		console.error(`FIELD must be one of: ${ALLOWED_FIELDS.join(', ')}`);
		process.exit(1);
	}

	const course = await kernel.course.get(COURSE_SLUG);
	if (!course) {
		console.error(`Course "${COURSE_SLUG}" not found.`);
		process.exit(1);
	}

	const updated = [];
	const unchanged = [];
	const failed = [];
	const emptyGroups = [];

	for (const groupSlug of new Set(GROUPS)) {
		let items = await kernel.library.listByGroup(COURSE_SLUG, groupSlug);
		if (TYPE) items = items.filter((i) => i.type === TYPE);

		// Empty = group has no (matching) items, or the group slug is a typo
		if (!items.length) {
			emptyGroups.push(groupSlug);
			continue;
		}

		for (const item of items) {
			const label = `${groupSlug.padEnd(6)} ${item.slug}`;

			if (item[FIELD] === VALUE) {
				unchanged.push(label);
				continue;
			}

			if (!APPLY) {
				updated.push(`${label}   (${item[FIELD]} → ${VALUE})`);
				continue;
			}

			try {
				await kernel.library.update(item.slug, { [FIELD]: VALUE });
				updated.push(label);
			} catch (err) {
				failed.push({ slug: item.slug, reason: err.message });
			}
		}
	}

	console.log('─'.repeat(50));
	console.log(`Course "${COURSE_SLUG}" · ${FIELD} = ${JSON.stringify(VALUE)}${TYPE ? ` · type ${TYPE}` : ''}`);
	if (updated.length) {
		console.log(`${APPLY ? '✅ updated' : '🔍 would update'} (${updated.length}):`);
		updated.forEach((s) => console.log(`   ${s}`));
	}
	if (unchanged.length) {
		console.log(`⏭  already set (${unchanged.length}):`);
		unchanged.forEach((s) => console.log(`   ${s}`));
	}
	if (emptyGroups.length) {
		console.log(`⚠️  no matching items — check slug (${emptyGroups.length}):`);
		emptyGroups.forEach((s) => console.log(`   ${s}`));
	}
	if (failed.length) {
		console.log(`❌ failed (${failed.length}):`);
		failed.forEach((f) => console.log(`   ${f.slug} — ${f.reason}`));
	}
	console.log('─'.repeat(50));
	console.log(`${updated.length} ${APPLY ? 'updated' : 'to update'}, ${unchanged.length} unchanged, ${failed.length} failed`);
	if (!APPLY) console.log('Dry run — set APPLY = true to write.');

	if (failed.length || emptyGroups.length) process.exitCode = 1;
}

main()
	.catch(console.error)
	.finally(() => kernel.shutdown());