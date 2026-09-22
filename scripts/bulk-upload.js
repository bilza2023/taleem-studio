// /home/bilal-tariq/00--TALEEM/taleem/scripts/bulk-upload.js

import kernel from 'taleem-kernel';
import { readFileSync } from 'fs';

const dataPath = process.argv[2];

async function main() {
	if (!dataPath) {
		console.error('Usage: node scripts/bulk-upload.js <data.json>');
		process.exit(1);
	}

	let items;
	try {
		const raw = readFileSync(dataPath, 'utf-8');
		items = JSON.parse(raw);
	} catch (err) {
		console.error(`Failed to read/parse ${dataPath}: ${err.message}`);
		process.exit(1);
	}

	if (!Array.isArray(items)) {
		console.error('data.json must be an array of { slug, body } objects.');
		process.exit(1);
	}

	const updated = [];
	const failed = [];

	for (const item of items) {
		const { slug, body } = item;

		if (!slug || body === undefined) {
			failed.push({ slug: slug ?? '(missing)', reason: 'missing slug or body in data.json' });
			continue;
		}

		try {
			await kernel.library.update(slug, { body: JSON.stringify(body) });
			updated.push(slug);
		} catch (err) {
			// Prisma throws P2025 when the slug (the @id) doesn't match any row
			const reason = err.code === 'P2025' ? 'slug not found' : err.message;
			failed.push({ slug, reason });
		}
	}

	console.log('─'.repeat(50));
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