// prisma/copy-lib.js

import { execSync } from 'node:child_process';
import fs from 'node:fs';

const DEV_DB = '/home/bilal-tariq/00--TALEEM/taleem/prisma/dev.db';
const BACKUP_DB = '/home/bilal-tariq/00--TALEEM/taleem/prisma/backup.db';

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.copyFileSync(DEV_DB, `${DEV_DB}.bak.${stamp}`);
console.log(`Backed up dev.db -> dev.db.bak.${stamp}`);

const sql = `
ATTACH DATABASE '${BACKUP_DB}' AS backup;

INSERT OR IGNORE INTO Library
  (slug, title, description, thumbnail, type, status, body, courseSlug, groupSlug,
   sortOrder, allowCommunication, meta, createdAt, updatedAt)
SELECT
  slug, title, description, 'fbise9math.svg', type, 'PUBLISHED', body, courseSlug, groupSlug,
  sortOrder, allowCommunication, meta, createdAt, updatedAt
FROM backup.Library
WHERE courseSlug = 'fbise9math'
  AND groupSlug = '4.5';

DETACH DATABASE backup;
`;

execSync(`sqlite3 "${DEV_DB}"`, {
	input: sql,
	stdio: ['pipe', 'inherit', 'inherit']
});

console.log('Done — check dev.db.');