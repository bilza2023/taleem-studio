<!-- /src/routes/admin/docs/+page.svelte -->
<script>
	import { page } from "$app/state";
	import { marked } from "marked";

	// Every .md in src/lib/docs, bundled at build time as plain text
	const files = import.meta.glob("/src/lib/docs/**/*.md", {
		query: "?raw",
		import: "default",
		eager: true
	});

	// file name → slug (number prefix only orders), first "# " heading → title
	const docs = Object.entries(files)
		.map(([path, text]) => {
			const file = path.split("/").pop().replace(/\.md$/, "");
			const slug = file.replace(/^\d+-/, "");
			const title = text.match(/^#\s+(.+)$/m)?.[1] ?? slug;
			return { file, slug, title, text };
		})
		.sort((a, b) => a.file.localeCompare(b.file));

	const slug = $derived(page.url.searchParams.get("doc") ?? docs[0]?.slug);
	const current = $derived(docs.find((d) => d.slug === slug));
	const html = $derived(current ? marked.parse(current.text) : "");
</script>

<div class="docs">
	<aside>
		<div class="aside-title">📚 Docs</div>
		{#each docs as d (d.slug)}
			<a href="?doc={d.slug}" class:active={d.slug === slug}>{d.title}</a>
		{/each}
		{#if !docs.length}
			<p class="muted">No docs yet — add .md files to src/lib/docs/</p>
		{/if}
	</aside>

	<article class="doc">
		{#if current}
			{@html html}
		{:else if docs.length}
			<p class="muted">Doc “{slug}” not found.</p>
		{/if}
	</article>
</div>

<style>
	.docs {
		display: grid;
		grid-template-columns: 240px 1fr;
		gap: 1.5rem;
        font-size: 1.5rem;
		max-width: 2000px;
		margin: 0 auto;
		padding: 1.5rem 1.5rem;
		color: #e8eeff;
	}

	/* ── Sidebar ── */
	aside {
		position: sticky;
		top: 1rem;
		align-self: start;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.75rem;
		background: #111c44;
		border: 1px solid #2c4590;
		border-radius: 12px;
	}
	.aside-title {
		font-weight: 700;
		padding: 0.25rem 0.5rem 0.6rem;
		border-bottom: 1px solid #2c4590;
		margin-bottom: 0.4rem;
	}
	aside a {
		padding: 0.45rem 0.6rem;
		border-radius: 6px;
		color: #8ea2d8;
		text-decoration: none;
		font-size: 0.92rem;
	}
	aside a:hover {
		color: #e8eeff;
		background: rgba(79, 140, 255, 0.1);
	}
	aside a.active {
		color: #fff;
		background: rgba(79, 140, 255, 0.22);
		font-weight: 600;
	}
	.muted {
		color: #8ea2d8;
		font-size: 0.9rem;
	}

	/* ── Rendered markdown ── */
	.doc {
		min-width: 0;
		padding: 1.5rem 2rem;
		background: #111c44;
		border: 1px solid #2c4590;
		border-radius: 12px;
		line-height: 1.65;
	}
	.doc :global(h1) {
		margin: 0 0 1rem;
		font-size: 1.9rem;
		color: #fff;
	}
	.doc :global(h2) {
		margin: 2rem 0 0.75rem;
		padding-bottom: 0.3rem;
		font-size: 1.35rem;
		color: #fff;
		border-bottom: 1px solid #2c4590;
	}
	.doc :global(h3) {
		margin: 1.5rem 0 0.5rem;
		font-size: 1.1rem;
		color: #cfe0ff;
	}
	.doc :global(p),
	.doc :global(li) {
		color: #dbe4ff;
	}
	.doc :global(a) {
		color: #4f8cff;
	}
	.doc :global(hr) {
		border: none;
		border-top: 1px solid #2c4590;
		margin: 2rem 0;
	}
	.doc :global(code) {
		font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
		font-size: 0.88em;
		padding: 0.1em 0.35em;
		border-radius: 4px;
		background: #0a1230;
		color: #9ec1ff;
	}
	.doc :global(pre) {
		margin: 1rem 0;
		padding: 1rem;
		overflow-x: auto;
		border-radius: 8px;
		background: #0a1230;
		border: 1px solid #2c4590;
	}
	.doc :global(pre code) {
		padding: 0;
		background: none;
		color: #dbe4ff;
		font-size: 0.85rem;
	}
	.doc :global(table) {
		width: 100%;
		margin: 1rem 0;
		border-collapse: collapse;
		font-size: 0.92rem;
	}
	.doc :global(th),
	.doc :global(td) {
		padding: 0.5rem 0.7rem;
		text-align: left;
		border-bottom: 1px solid #2c4590;
		background: transparent;
		color: #dbe4ff;
	}
	.doc :global(th) {
		color: #8ea2d8;
		font-weight: 600;
	}
	.doc :global(blockquote) {
		margin: 1rem 0;
		padding: 0.5rem 1rem;
		border-left: 3px solid #4f8cff;
		background: rgba(79, 140, 255, 0.08);
		color: #cfe0ff;
	}
</style>