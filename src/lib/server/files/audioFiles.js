// src/lib/server/audioFiles.js
// Plain Node helpers for publishing audio (no DB, no $lib imports).
// Filters are read from scripts/process.sh — the one place they live.

import { execFileSync } from "child_process";
import {
	readFileSync, existsSync, mkdirSync, renameSync,
	copyFileSync, unlinkSync, statSync
} from "fs";
import { join } from "path";
import { homedir } from "os";

export const ROOT = process.cwd(); // project root (dev and node build)
export const AUDIO_DIR = join(ROOT, "content", "audio");
export const ARCHIVE_DIR = join(homedir(), "00--TALEEM", "audio", "archieve");
const PROCESS_SH = join(ROOT, "scripts", "process.sh");

export function readFilters() {
	const text = readFileSync(PROCESS_SH, "utf-8");
	const m = text.match(/^FILTERS="([^"]+)"/m);
	if (!m) throw new Error(`No FILTERS="…" line found in ${PROCESS_SH}`);
	return m[1];
}

// src (any audio) → out (.opus). Temp file first: a failed run never leaves a broken .opus
export function encodeOpus(src, out, filters = readFilters()) {
	mkdirSync(AUDIO_DIR, { recursive: true });
	const tmp = `${out}.tmp`;
	try {
		execFileSync("ffmpeg", [
			"-loglevel", "error", "-y",
			"-i", src,
			"-af", filters,
			"-ar", "48000", "-ac", "1",
			"-c:a", "libopus", "-b:a", "32k",
			"-f", "opus", tmp
		], { stdio: ["ignore", "ignore", "pipe"] });
	} catch (err) {
		if (existsSync(tmp)) unlinkSync(tmp);
		const msg = err.stderr?.toString().trim() || err.message;
		throw new Error(`ffmpeg failed: ${msg}`);
	}
	renameSync(tmp, out);
}

function moveFile(from, to) {
	try {
		renameSync(from, to);
	} catch (err) {
		if (err.code !== "EXDEV") throw err; // different disk → copy + delete
		copyFileSync(from, to);
		unlinkSync(from);
	}
}

// Keep the raw recording: ARCHIVE_DIR/<slug>.webm (timestamped if taken)
export function archiveRaw(file, slug, ext = "webm") {
	mkdirSync(ARCHIVE_DIR, { recursive: true });
	let dest = join(ARCHIVE_DIR, `${slug}.${ext}`);
	if (existsSync(dest)) {
		const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
		dest = join(ARCHIVE_DIR, `${slug}_${stamp}.${ext}`);
	}
	moveFile(file, dest);
	return dest;
}

export function fileSizeMb(file) {
	return Number((statSync(file).size / 1024 / 1024).toFixed(2));
}
// Keep a copy of a file before it is replaced: ARCHIVE_DIR/<slug>_<stamp>.<ext>
export function archiveCopy(file, slug, ext = "opus") {
	mkdirSync(ARCHIVE_DIR, { recursive: true });
	const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").slice(0, 15);
	const dest = join(ARCHIVE_DIR, `${slug}_${stamp}.${ext}`);
	copyFileSync(file, dest);
	return dest;
}