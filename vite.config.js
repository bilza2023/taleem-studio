import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.test.js'],
		fileParallelism: false,               // one file at a time: SQLite has one writer
		env: { DATABASE_URL: 'file:./test.db' } // never touch dev.db
	}
});