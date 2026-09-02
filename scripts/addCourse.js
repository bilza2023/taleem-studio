// /home/bilal-tariq/00--TALEEM/taleem.studio/scripts/createCourse.js

import kernel from 'taleem-kernel';

async function main() {
	const course = await kernel.course.create({
		slug: 'fbise9mathQuickReference',
		title: 'Class 9th Math Quic Reference',
		description: 'Class 9th Math Quic Reference',
		access: 'MEMBERS',      // OPEN | MEMBERS | SUBSCRIPTION
		isActive: true,
		thumbnail: 'taleem.webp'
	});

	console.log('Created:', course.slug);
}

main()
	.catch(console.error)
	.finally(() => kernel.shutdown());