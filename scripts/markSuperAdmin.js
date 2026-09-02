// /home/bilal-tariq/00--TALEEM/taleem.studio/scripts/mark-super-admin.js

import kernel from 'taleem-kernel';

const email = process.argv[2];

async function main() {
	if (!email) {
		console.error('Usage: node scripts/mark-super-admin.js <email>');
		process.exit(1);
	}

	const admin = await kernel.admin.get(email);

	if (!admin) {
		console.error(`Admin '${email}' not found. Create the admin first.`);
		process.exit(1);
	}

	const updated = await kernel.admin.update(email, { role: 'SUPER_ADMIN' });
	console.log(`Marked as super admin: ${updated.email}`);
}

main()
	.catch(console.error)
	.finally(() => kernel.shutdown());