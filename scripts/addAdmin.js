
// /home/bilal-tariq/00--TALEEM/taleem.studio/scripts/addAdmin.js

import kernel from 'taleem-kernel';

async function main() {
	const admin = await kernel.admin.create({
		email: 'bilal@taleem.help',
		password: '12345678',
		courseSlugs: JSON.stringify(["fbise9math" , "blog"])
	});

	console.log('Created:', admin.email);
}

main()
	.catch(console.error)
	.finally(() => kernel.shutdown());