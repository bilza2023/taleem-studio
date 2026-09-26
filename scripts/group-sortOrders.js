// /home/bilal-tariq/00--TALEEM/taleem/scripts/group-sortOrders.js
// Assigns Group.sortOrder = 10, 20, 30… for ONE course, in chapter/exercise order.
//
//   node scripts/group-sortOrders.js           → dry run (prints, writes nothing)
//   node scripts/group-sortOrders.js --apply   → write to DB

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ════════════════════════════════════════════════
// EDIT HERE
// ════════════════════════════════════════════════

const COURSE_SLUG = 'fbise9math';

// ════════════════════════════════════════════════

const APPLY = process.argv.includes('--apply');

const STEP = 10;         // gaps so you can insert between later (e.g. 25)
const INTRO_POS = -1;    // chN-intro → before the chapter's exercises
const MISC_POS = 9999;   // chN-misc  → after the chapter's exercises

// Work out (chapter, position) from slug, falling back to title.
function sortKey(group) {
	for (const text of [group.slug, group.title]) {
		if (!text) continue;

		// "6.2", "Ex 6.2", "Exercise 6.2", "ex 9.1"
		const ex = text.match(/(\d+)\.(\d+)/);
		if (ex) return { chapter: +ex[1], pos: +ex[2], known: true };

		// "ch6-intro", "ch6-misc", "Chapter 6 Introduction"
		const ch = text.match(/ch(?:apter)?[\s-]*(\d+)/i);
		if (ch) {
			if (/intro/i.test(text)) return { chapter: +ch[1], pos: INTRO_POS, known: true };
			if (/misc/i.test(text)) return { chapter: +ch[1], pos: MISC_POS, known: true };
		}
	}
	return { chapter: Infinity, pos: Infinity, known: false }; // unrecognised → end
}

async function main() {
	const groups = await prisma.group.findMany({
		where: { courseSlug: COURSE_SLUG },
		orderBy: { id: 'asc' }
	});

	if (!groups.length) {
		console.error(`No groups found for course "${COURSE_SLUG}".`);
		process.exit(1);
	}

	const rows = groups
		.map((group) => ({ group, key: sortKey(group) }))
		.sort((a, b) =>
			a.key.chapter - b.key.chapter ||
			a.key.pos - b.key.pos ||
			a.group.slug.localeCompare(b.group.slug, undefined, { numeric: true }) ||
			a.group.id - b.group.id
		);

	const updates = [];
	let unknownCount = 0;

	console.log('─'.repeat(60));
	console.log(`Course "${COURSE_SLUG}" (${rows.length} groups)`);

	rows.forEach(({ group, key }, i) => {
		const next = (i + 1) * STEP;
		const changed = group.sortOrder !== next;
		if (!key.known) unknownCount++;

		console.log(
			`${key.known ? '  ' : '⚠️'} ${String(next).padStart(5)}  ${group.slug.padEnd(16)} ${group.title}` +
			(changed ? `   (was ${group.sortOrder})` : '')
		);

		if (changed) updates.push({ id: group.id, sortOrder: next });
	});

	console.log('─'.repeat(60));
	if (unknownCount) {
		console.log(`⚠️  ${unknownCount} group(s) not recognised → placed at the end. Check them above.`);
	}

	if (!APPLY) {
		console.log(`DRY RUN — ${updates.length} would change. Re-run with --apply to write.`);
		return;
	}

	if (!updates.length) {
		console.log('Nothing to change.');
		return;
	}

	// All-or-nothing
	await prisma.$transaction(
		updates.map((u) =>
			prisma.group.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder } })
		)
	);

	console.log(`✅ ${updates.length} group(s) updated.`);
}

main()
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());