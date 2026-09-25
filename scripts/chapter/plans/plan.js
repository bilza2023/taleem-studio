

export default {
	courseSlug: 'blog',
	prefix: 'blog-test-', // decks only · must end with '-'
	thumbnail: 'blog.svg',

	groups: [
		{
			slug: 'test-shapes',
			title: 'Test · Shapes',
			decks: ['shapes-circle', 'shapes-square'] // order = sortOrder
		},
		{
			slug: 'test-numbers',
			title: 'Test · Numbers',
			decks: ['numbers-intro', { name: 'numbers-line', title: 'The Number Line' }]
		}
	],

	svgs: ['blog-test-circle.svg', 'blog-test-number-line.svg']
};