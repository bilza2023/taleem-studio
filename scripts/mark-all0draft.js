// /home/bilal-tariq/00--TALEEM/taleem/scripts/library-all-draft.js
// Usage: node scripts/library-all-draft.js
// Runs as a dry run until APPLY = true.

import { PrismaClient } from '@prisma/client';

const APPLY = true; // false = preview only, true = write

const prisma = new PrismaClient();

async function main() {
	const total = await prisma.library.count();
	const toChange = await prisma.library.count({
		where: { status: { not: 'DRAFT' } }
	});

	console.log('─'.repeat(50));
	console.log(`Library items: ${total} total, ${toChange} not DRAFT`);

	if (!APPLY) {
		console.log('Dry run — set APPLY = true to write.');
		return;
	}

	const result = await prisma.library.updateMany({
		where: { status: { not: 'DRAFT' } },
		data: { status: 'DRAFT' }
	});

	console.log(`✅ ${result.count} items set to DRAFT`);
	console.log('─'.repeat(50));
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());