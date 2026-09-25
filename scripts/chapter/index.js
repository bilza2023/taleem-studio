// /home/bilal-tariq/00--TALEEM/taleem/scripts/chapter-object/index.js
// CLI for the chapter object. Dry run unless --apply. Backs up dev.db before any write.
//
//   node scripts/chapter-object/index.js create     <plan.js>                [--apply]
//   node scripts/chapter-object/index.js upload-svg <plan.js> <svg-folder>   [--overwrite] [--apply]
//   node scripts/chapter-object/index.js upload     <plan.js> <data.json>    [--overwrite] [--apply]

import kernel from 'taleem-kernel';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createChapter, uploadSvgs, uploadDecks } from './chapter.js';

const DEV_DB = '/home/bilal-tariq/00--TALEEM/taleem/prisma/dev.db';

const args = process.argv.slice(2);
const [cmd, planPath, source] = args.filter((a) => !a.startsWith('--'));
const APPLY = args.includes('--apply');
const OVERWRITE = args.includes('--overwrite');

const USAGE = `Usage:
  node scripts/chapter-object/index.js create     <plan.js>              [--apply]
  node scripts/chapter-object/index.js upload-svg <plan.js> <svg-folder> [--overwrite] [--apply]
  node scripts/chapter-object/index.js upload     <plan.js> <data.json>  [--overwrite] [--apply]`;

// ─── inputs ──────────────────────────────────────────────────────────────────
async function loadPlan(p) {
	const mod = await import(pathToFileURL(path.resolve(p)).href);
	return mod.default;
}

function readSvgFolder(dir) {
	return fs
		.readdirSync(dir)
		.filter((f) => f.toLowerCase().endsWith('.svg'))
		.map((f) => ({ slug: f, content: fs.readFileSync(path.join(dir, f), 'utf-8') }));
}

function readDeckJson(file) {
	const items = JSON.parse(fs.readFileSync(file, 'utf-8'));
	if (!Array.isArray(items)) throw new Error('data.json must be an array of { slug, body }');
	return items.map((i) => ({ slug: i?.slug, content: i?.body }));
}

function backup() {
	if (!fs.existsSync(DEV_DB)) throw new Error(`DB not found at ${DEV_DB} — fix DEV_DB before --apply`);
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const dest = `${DEV_DB}.bak.${stamp}`;
	fs.copyFileSync(DEV_DB, dest);
	console.log(`💾 backup → ${path.basename(dest)}`);
}

// ─── report ──────────────────────────────────────────────────────────────────
function list(icon, label, items, fmt = (x) => x) {
	if (!items?.length) return;
	console.log(`${icon} ${label} (${items.length}):`);
	items.forEach((x) => console.log(`   ${fmt(x)}`));
}

function pending(r) {
	return r.kind === 'create'
		? r.groups.create.length + r.svgs.create.length + r.decks.create.length
		: r.write.length;
}

function print(r) {
	const verb = r.applied ? '✅ created' : '🔍 will create';
	console.log('─'.repeat(60));

	if (r.kind === 'create') {
		list(verb, 'groups', r.groups.create, (g) => `${g.slug}  "${g.title}"`);
		list(verb, 'svgs', r.svgs.create, (s) => s.slug);
		list(verb, 'decks', r.decks.create, (d) => `${d.groupSlug.padEnd(10)} #${d.sortOrder}  ${d.slug}`);
		list('⏭ ', 'groups already exist', r.groups.exists, (g) => g.slug);
		list('⚠️ ', 'svgs already exist — reuse or name clash?', r.svgs.exists, (s) => s.slug);
		list('⏭ ', 'decks already exist', r.decks.exists, (d) => d.slug);
		list('❌', 'deck conflicts', r.decks.conflict, (d) => `${d.slug} → already in ${d.where}`);
	} else {
		const w = r.applied ? '✅ written' : '🔍 will write';
		console.log(`Mode: ${r.mode}`);
		list(w, 'bodies', r.write);
		list('⏭ ', 'already filled — skipped (use --overwrite)', r.skipFilled);
		list('⏭ ', 'unchanged', r.unchanged);
		list('…', 'planned, no content in this upload', r.missing);
		list('❌', 'not in plan', r.notInPlan);
		list('❌', 'not created yet', r.notCreated);
		list('❌', 'invalid', r.invalid, (i) => `${i.slug} — ${i.reason}`);
	}

	list('ℹ️ ', 'notes', r.notes);
	list('❌', 'failed', r.failed, (f) => `${f.slug} — ${f.reason}`);
	list('🛑', 'errors — nothing written', r.errors);

	console.log('─'.repeat(60));
	if (!r.applied && !r.errors.length) {
		console.log(pending(r) ? 'Dry run — re-run with --apply to write.' : 'Nothing to do.');
	}
}

// ─── main ────────────────────────────────────────────────────────────────────
async function main() {
	const needsSource = cmd === 'upload-svg' || cmd === 'upload';
	if (!['create', 'upload-svg', 'upload'].includes(cmd) || !planPath || (needsSource && !source)) {
		console.error(USAGE);
		process.exitCode = 1;
		return;
	}

	const plan = await loadPlan(planPath);
	const items = cmd === 'upload-svg' ? readSvgFolder(source) : cmd === 'upload' ? readDeckJson(source) : null;

	const run = (apply) =>
		cmd === 'create'
			? createChapter(kernel, plan, { apply })
			: cmd === 'upload-svg'
				? uploadSvgs(kernel, plan, items, { apply, overwrite: OVERWRITE })
				: uploadDecks(kernel, plan, items, { apply, overwrite: OVERWRITE });

	// Pass 1 is always a dry run. Only if it is clean do we back up and write.
	let report = await run(false);
	if (APPLY && !report.errors.length && pending(report)) {
		backup();
		report = await run(true);
	}

	print(report);
	if (report.errors.length || report.failed.length) process.exitCode = 1;
}

main()
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(() => kernel.shutdown());