// /home/bilal-tariq/00--TALEEM/taleem/scripts/set-course-thumbnail.js

import { execSync } from 'node:child_process';
import fs from 'node:fs';

// ---- Edit this before running ----
const COURSE_SLUG = 'fbise9math';
const THUMBNAIL = 'fbise9math.svg';
// -----------------------------------

const DEV_DB = '/home/bilal-tariq/00--TALEEM/taleem/prisma/dev.db';

function runQuery(sql) {
	return execSync(`sqlite3 "${DEV_DB}"`, { input: sql, encoding: 'utf-8' });
}

const count = runQuery(
	`SELECT COUNT(*) FROM Library WHERE courseSlug = '${COURSE_SLUG}';`
).trim();

console.log(`Found ${count} Library row(s) with courseSlug = '${COURSE_SLUG}'.`);

if (count === '0') {
	console.log('Nothing to update. Exiting.');
	process.exit(0);
}

const rows = runQuery(
	`.mode list
.separator " | "
SELECT slug, title, thumbnail FROM Library WHERE courseSlug = '${COURSE_SLUG}';`
);

console.log('Rows that will be updated (slug | title | current thumbnail):');
console.log(rows);

const proceed = process.argv.includes('--apply');

if (!proceed) {
	console.log('Dry run only. Re-run with --apply to actually write these changes.');
	process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.copyFileSync(DEV_DB, `${DEV_DB}.bak.${stamp}`);
console.log(`Backed up dev.db -> dev.db.bak.${stamp}`);

runQuery(
	`UPDATE Library SET thumbnail = '${THUMBNAIL}' WHERE courseSlug = '${COURSE_SLUG}';`
);

console.log(`Updated. New thumbnail: '${THUMBNAIL}' for courseSlug = '${COURSE_SLUG}'.`);