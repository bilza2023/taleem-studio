// scripts/delete-bulk.js
// Deletes ALL fbise9math Chapter 4 Library items (groups 4.1, 4.2, ... 4.x).
// Groups themselves and Svg rows (e.g. ex4-8-*.svg) are NOT touched.
//
// Usage (run from project root):
//   node scripts/delete-bulk.js          -> dry run, only lists what would be deleted
//   node scripts/delete-bulk.js --yes    -> actually deletes

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const COURSE = "fbise9math";
const GROUP_PREFIX = "4."; // matches 4.1, 4.2 ... 4.6 (not 14.1 — startsWith)
const CONFIRM = process.argv.includes("--yes");

async function main() {
	const items = await prisma.library.findMany({
		where: { courseSlug: COURSE, groupSlug: { startsWith: GROUP_PREFIX } },
		select: { slug: true, groupSlug: true, type: true, status: true },
		orderBy: [{ groupSlug: "asc" }, { sortOrder: "asc" }]
	});

	if (items.length === 0) {
		console.log("Nothing to delete.");
		return;
	}

	console.table(items);
	const slugs = items.map((i) => i.slug);

	// Communication -> Library is onDelete: Restrict, so check first
	const comms = await prisma.communication.count({
		where: { librarySlug: { in: slugs } }
	});
	if (comms > 0) {
		console.error(
			`ABORT: ${comms} Communication row(s) reference these items. ` +
				`Handle them first (Restrict would block the delete).`
		);
		process.exitCode = 1;
		return;
	}

	if (!CONFIRM) {
		console.log(`\nDRY RUN: ${items.length} item(s) would be deleted. Re-run with --yes.`);
		return;
	}

	const res = await prisma.library.deleteMany({
		where: { slug: { in: slugs } }
	});
	console.log(`\nDeleted ${res.count} Library item(s) from Chapter 4.`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());