// /home/bilal-tariq/00--TALEEM/taleem/scripts/publish-audio.js
//
// Downloads/<slug>.webm  →  filters (from scripts/process.sh)  →  content/audio/<slug>.opus
//   • newest copy wins; older Chrome copies "<slug> (1).webm" … are deleted
//   • the .opus file is always (re)written
//   • Audio table: row "<slug>.opus" is created only if it does not exist yet
//   • the used .webm is moved to ~/00--TALEEM/audio/archieve/
//
// Usage (run from project root):
//   node scripts/publish-audio.js <slug> [<slug> …]   one or more lessons
//   node scripts/publish-audio.js                      every .webm in Downloads

import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'child_process';
import {
	readFileSync, readdirSync, statSync, existsSync,
	mkdirSync, renameSync, copyFileSync, unlinkSync
} from 'fs';
import { join, dirname, resolve } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

// ════════════════════════════════════════════════
// PATHS
// ════════════════════════════════════════════════

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOWNLOADS = join(homedir(), 'Downloads');
const OUT_DIR = join(REPO, 'content', 'audio');
const ARCHIVE = join(homedir(), '00--TALEEM', 'audio', 'archieve');
const PROCESS_SH = join(REPO, 'scripts', 'process.sh');

// ════════════════════════════════════════════════

// Filters live in one place: process.sh
function readFilters() {
	const text = readFileSync(PROCESS_SH, 'utf-8');
	const m = text.match(/^FILTERS="([^"]+)"/m);
	if (!m) throw new Error(`No FILTERS="…" line found in ${PROCESS_SH}`);
	return m[1];
}

// "<slug>.webm" or "<slug> (3).webm"  →  Map(slug → [{ slug, file, mtime }], newest first)
function findRecordings() {
	const rx = /^(.+?)(?: \(\d+\))?\.webm$/;
	const bySlug = new Map();

	for (const name of readdirSync(DOWNLOADS)) {
		const m = name.match(rx);
		if (!m) continue;
		const file = join(DOWNLOADS, name);
		const entry = { slug: m[1], file, mtime: statSync(file).mtimeMs };
		if (!bySlug.has(entry.slug)) bySlug.set(entry.slug, []);
		bySlug.get(entry.slug).push(entry);
	}

	for (const list of bySlug.values()) list.sort((a, b) => b.mtime - a.mtime);
	return bySlug;
}

function moveFile(from, to) {
	try {
		renameSync(from, to);
	} catch (err) {
		if (err.code !== 'EXDEV') throw err; // different disk → copy + delete
		copyFileSync(from, to);
		unlinkSync(from);
	}
}

function archive(file, slug) {
	mkdirSync(ARCHIVE, { recursive: true });
	let dest = join(ARCHIVE, `${slug}.webm`);
	if (existsSync(dest)) {
		const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
		dest = join(ARCHIVE, `${slug}_${stamp}.webm`);
	}
	moveFile(file, dest);
	return dest;
}

function encode(src, out, filters) {
	// Temp file first, so a failed run never leaves a half-written .opus
	const tmp = `${out}.tmp`;
	execFileSync('ffmpeg', [
		'-loglevel', 'error', '-y',
		'-i', src,
		'-af', filters,
		'-ar', '48000', '-ac', '1',
		'-c:a', 'libopus', '-b:a', '32k',
		'-f', 'opus', tmp
	], { stdio: ['ignore', 'inherit', 'inherit'] });
	renameSync(tmp, out);
}

function duration(file) {
	try {
		const s = execFileSync('ffprobe', [
			'-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file
		]).toString().trim();
		const t = Number(s);
		return Number.isFinite(t)
			? `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`
			: '?';
	} catch {
		return '?';
	}
}

async function publish(slug, copies, filters) {
	const [newest, ...older] = copies;
	const name = `${slug}.opus`;
	const out = join(OUT_DIR, name);

	// 1. Encode newest copy → content/audio/<slug>.opus (always replaced)
	encode(newest.file, out, filters);

	// 2. Older Chrome copies are not needed
	for (const c of older) unlinkSync(c.file);

	// 3. Keep the raw recording
	const archived = archive(newest.file, slug);

	// 4. Audio row: only if missing
	const existing = await prisma.audio.findUnique({ where: { slug: name } });
	if (!existing) {
		await prisma.audio.create({ data: { slug: name, title: name, tags: '[]' } });
	}

	// 5. Just a warning: is there a lesson with this slug?
	const lesson = await prisma.library.findUnique({ where: { slug }, select: { slug: true } });

	const sizeMb = (statSync(out).size / 1024 / 1024).toFixed(2);
	return {
		slug,
		lines: [
			`source:  ${newest.file}${older.length ? `  (deleted ${older.length} older cop${older.length > 1 ? 'ies' : 'y'})` : ''}`,
			`output:  content/audio/${name}  (${sizeMb} MB, ${duration(out)})`,
			`db:      ${existing ? 'Audio row already exists — unchanged' : 'Audio row created'}`,
			`archive: ${archived}`,
			...(lesson ? [] : [`⚠️  no lesson with slug "${slug}" — check the name`])
		]
	};
}

async function main() {
	if (!existsSync(DOWNLOADS)) throw new Error(`Downloads folder not found: ${DOWNLOADS}`);
	mkdirSync(OUT_DIR, { recursive: true });

	const filters = readFilters();
	const recordings = findRecordings();

	// Which slugs: from arguments, or everything found in Downloads
	const wanted = process.argv.slice(2).map((s) => s.replace(/\.webm$/, ''));
	const slugs = wanted.length ? wanted : [...recordings.keys()];

	if (!slugs.length) {
		console.log(`No .webm files in ${DOWNLOADS}`);
		return;
	}

	const done = [];
	const failed = [];

	for (const slug of slugs) {
		const copies = recordings.get(slug);
		if (!copies?.length) {
			failed.push({ slug, reason: `no ${slug}.webm in Downloads` });
			continue;
		}
		try {
			done.push(await publish(slug, copies, filters));
		} catch (err) {
			failed.push({ slug, reason: err.message });
		}
	}

	console.log('─'.repeat(60));
	for (const d of done) {
		console.log(`✅ ${d.slug}`);
		d.lines.forEach((l) => console.log(`   ${l}`));
	}
	for (const f of failed) {
		console.log(`❌ ${f.slug} — ${f.reason}`);
	}
	console.log('─'.repeat(60));
	console.log(`${done.length} published, ${failed.length} failed`);

	if (failed.length) process.exitCode = 1;
}

main()
	.catch((err) => {
		console.error(err.message ?? err);
		process.exitCode = 1;
	})
	.finally(() => prisma.$disconnect());