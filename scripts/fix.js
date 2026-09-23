// /home/bilal-tariq/00--TALEEM/taleem/scripts/fix-ch6.js
// One-off fix for Chapter 6:
//   1. Move the 10 Ex 6.6 decks from group '6.5' to '6.6' and reset their sortOrder to 0–9
//   2. (optional) Set Ch6 thumbnails from 'blog.svg' to 'fbise9math.svg'

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FIX_THUMBNAILS = true; // set to false to skip step 2

async function main() {
	// Step 1: only touches rows still sitting in 6.5, so re-running is safe
	const moved = await prisma.library.updateMany({
		where: {
			courseSlug: 'fbise9math',
			groupSlug: '6.5',
			slug: { startsWith: 'fbise9math-ex6.6-' }
		},
		data: {
			groupSlug: '6.6',
			sortOrder: { decrement: 10 }
		}
	});
	console.log(`Moved to group 6.6: ${moved.count} (expected 10, or 0 if already fixed)`);

	if (FIX_THUMBNAILS) {
		const thumbs = await prisma.library.updateMany({
			where: {
				courseSlug: 'fbise9math',
				OR: [
					{ slug: { startsWith: 'fbise9math-ex6.' } },
					{ slug: { startsWith: 'fbise9math-misc6-' } },
					{ slug: { startsWith: 'fbise9math-ch6-intro-' } }
				]
			},
			data: { thumbnail: 'fbise9math.svg' }
		});
		console.log(`Thumbnails set: ${thumbs.count} (expected 153)`);
	}

	// Verify the result
	const check = await prisma.library.groupBy({
		by: ['groupSlug'],
		where: { courseSlug: 'fbise9math', groupSlug: { in: ['6.5', '6.6'] } },
		_count: true
	});
	console.log('Decks per group:', check.map((g) => `${g.groupSlug}=${g._count}`).join(', '));
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());