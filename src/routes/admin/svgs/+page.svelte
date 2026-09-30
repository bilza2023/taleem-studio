<script>
///home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/svgs/+page.svelte

	import { config } from "$lib/config";
	import { send } from "$lib/send";

	const PAGE_SIZE = 50;

	let items = $state([]);
	let page = $state(1);
	let totalPages = $state(1);
	let total = $state(0);
	let loading = $state(true);
	let error = $state("");
	let active = $state("svgs");

	// ── quick edit: one card open at a time ──
	let quickSlug = $state(null);
	let quickText = $state("");
	let quickMsg = $state("");
	let quickOk = $state(false);
	let quickSaving = $state(false);

	// ── search: fetch all once, filter locally ──
	let query = $state("");
	let allItems = $state(null);
	let searching = $state(false);

	let isSearch = $derived(query.trim().length > 0);

	let results = $derived.by(() => {
		if (!isSearch || !allItems) return [];
		const words = query.toLowerCase().trim().split(/\s+/);
		return allItems.filter((svg) => {
			const hay = `${svg.slug} ${svg.title ?? ""} ${svg.tags ?? ""}`.toLowerCase();
			return words.every((w) => hay.includes(w));
		});
	});

	let shown = $derived(isSearch ? results : items);

	async function ensureAll() {
		if (allItems || searching) return;
		searching = true;

		try {
			const data = await send("svg", "listPaginated", {
				page: 1,
				pageSize: Math.max(total, 10000)
			});
			allItems = data.items;

		} catch (e) {
			error = e.message;

		} finally {
			searching = false;
		}
	}

	function onSearchInput() {
		quickSlug = null;
		if (query.trim()) ensureAll();
	}

	function clearSearch() {
		query = "";
		quickSlug = null;
	}

	async function load() {
		loading = true;
		error = "";
		quickSlug = null;

		try {
			const data = await send("svg", "listPaginated", {
				page,
				pageSize: PAGE_SIZE
			});

			items = data.items;
			page = data.page;
			totalPages = data.totalPages;
			total = data.total;

		} catch (e) {
			error = e.message;

		} finally {
			loading = false;
		}
	}

	function editUrl(slug) {
		return `${config.basePath}/admin/edit/svg?slug=${encodeURIComponent(slug)}`;
	}

	async function deleteSvg(slug) {
		if (!confirm(`Delete ${slug}?`)) return;

		try {
			await send("svg", "delete", { slug });
			await load();

			allItems = null; // search cache is stale now
			if (query.trim()) await ensureAll();

		} catch (e) {
			console.error(e);
			alert(e.message);
		}
	}

	function toggleQuick(slug) {
		if (quickSlug === slug) {
			quickSlug = null;
			return;
		}
		quickSlug = slug;
		quickText = "";
		quickMsg = "";
	}

	async function saveQuick(svg) {
		const body = quickText.trim();

		if (!body.includes("<svg") || !body.endsWith("</svg>")) {
			quickOk = false;
			quickMsg = "Not a complete <svg>…</svg>";
			return;
		}

		if (svg.body?.trim() && !confirm(`Replace existing SVG in ${svg.slug}?`)) return;

		quickSaving = true;
		quickMsg = "";

		try {
			await send("svg", "update", { slug: svg.slug, data: { body } });
			svg.body = body; // card preview re-renders = visual check

			// keep the other list (paged / search cache) in sync
			const a = items.find((x) => x.slug === svg.slug);
			if (a) a.body = body;
			const b = allItems?.find((x) => x.slug === svg.slug);
			if (b) b.body = body;

			quickText = "";
			quickOk = true;
			quickMsg = "Saved ✓";

		} catch (e) {
			quickOk = false;
			quickMsg = e.message;

		} finally {
			quickSaving = false;
		}
	}

	function prevPage() {
		if (page > 1) {
			page -= 1;
			load();
		}
	}

	function nextPage() {
		if (page < totalPages) {
			page += 1;
			load();
		}
	}

	$effect(() => {
		load();
	});
		function viewUrl(slug) {
		return `${config.basePath}/content/images/${encodeURIComponent(slug)}`;
	}
</script>

<div class="page">

	<div class="header">
		<h1>SVGs</h1>

		<div class="search">
			<input
				type="search"
				placeholder="Search slug, title, tags…"
				bind:value={query}
				oninput={onSearchInput}
				onkeydown={(e) => e.key === "Escape" && clearSearch()}
			/>
			{#if isSearch}
				<button onclick={clearSearch} title="Clear">✖</button>
			{/if}
		</div>

		<div class="count">
			{#if isSearch}
				{searching ? "Searching…" : `${results.length} found`}
			{:else}
				{total} total
			{/if}
		</div>
	</div>

	{#if loading && !isSearch}

		<p>Loading...</p>

	{:else if error}

		<p class="error">{error}</p>

	{:else if isSearch && searching}

		<p>Loading all SVGs for search...</p>

	{:else if shown.length === 0}

		<p>No SVGs found.</p>

	{:else}

		<div class="grid">

			{#each shown as svg (svg.slug)}

				<article class="card">

					<div class="preview">
						<a href={viewUrl(svg.slug)} target="_blank" rel="noopener noreferrer" title="Open full size">
							{#key svg.body}
								<object
									type="image/svg+xml"
									data={`data:image/svg+xml;utf8,${encodeURIComponent(svg.body)}`}
									aria-label={svg.title || svg.slug}
								></object>
							{/key}
						</a>
					</div>

					<div class="info">
						<strong>{svg.slug}</strong>

						{#if svg.title}
							<span>{svg.title}</span>
						{/if}

						{#if svg.tags}
							<small>{svg.tags}</small>
						{/if}
					</div>

					<div class="actions">
						<a href={editUrl(svg.slug)}>
							<button>Edit</button>
						</a>

						<button onclick={() => toggleQuick(svg.slug)}>
							{quickSlug === svg.slug ? "Close" : "Q-Edit"}
						</button>

						<button onclick={() => deleteSvg(svg.slug)}>
							Delete
						</button>
					</div>

					{#if quickSlug === svg.slug}
						<form
							class="quick"
							onsubmit={(e) => {
								e.preventDefault();
								saveQuick(svg);
							}}
						>
							<textarea
								bind:value={quickText}
								rows="4"
								placeholder="Paste <svg>…</svg> here"
								spellcheck="false"
							></textarea>

							<button type="submit" disabled={quickSaving || !quickText.trim()}>
								{quickSaving ? "Saving..." : "Save"}
							</button>

							{#if quickMsg}
								<small class={quickOk ? "ok" : "error"}>{quickMsg}</small>
							{/if}
						</form>
					{/if}

				</article>

			{/each}

		</div>

		{#if !isSearch}
			<div class="pagination">
				<button onclick={prevPage} disabled={page <= 1}>
					← Prev
				</button>

				<span>Page {page} of {totalPages}</span>

				<button onclick={nextPage} disabled={page >= totalPages}>
					Next →
				</button>
			</div>
		{/if}

	{/if}

</div>
<style>
.page {
	max-width: 1200px;
	margin: 40px auto;
	padding: 0 24px;
	color: aliceblue;
	font-family: system-ui, sans-serif;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 20px;
	margin-bottom: 25px;
}

.search {
	flex: 1;
	max-width: 480px;
	display: flex;
	gap: 6px;
}

.search input {
	flex: 1;
	padding: 8px 12px;
	font: inherit;
	color: aliceblue;
	background: #111;
	border: 1px solid #444;
	border-radius: 6px;
}

.search input:focus {
	outline: none;
	border-color: #5fa8ff;
}

.count {
	opacity: .7;
	white-space: nowrap;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 18px;
	align-items: start;
}

.card {
	overflow: hidden;
	border: 1px solid #444;
	border-radius: 7px;
	background: #181818;
}

/* ── preview: SVG gets the whole box ── */
.preview {
	aspect-ratio: 16 / 10;
	background: #0f1629; /* matches the slides, hides the SVG's own transparent margin */
}

.preview a {
	display: block;
	width: 100%;
	height: 100%;
}

.preview object {
	display: block;
	width: 100%;
	height: 100%;
	pointer-events: none; /* let the click reach the link */
}

.info {
	display: grid;
	gap: 5px;
	padding: 12px;
}

.info strong {
	overflow-wrap: anywhere;
}

.info small {
	opacity: .65;
}

.actions {
	display: flex;
	gap: 8px;
	padding: 0 12px 12px;
}

.actions a {
	text-decoration: none;
}

.quick {
	display: grid;
	gap: 8px;
	padding: 0 12px 12px;
}

.quick textarea {
	width: 100%;
	box-sizing: border-box;
	resize: vertical;
	padding: 6px;
	font: 12px/1.4 ui-monospace, monospace;
	color: aliceblue;
	background: #111;
	border: 1px solid #444;
	border-radius: 4px;
}

.ok {
	color: #7ddc8a;
}

button {
	padding: 7px 12px;
	border: 0;
	border-radius: 4px;
	cursor: pointer;
}

button:disabled {
	opacity: .5;
	cursor: default;
}

.pagination {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 16px;
	margin-top: 30px;
}

.error {
	color: #ff7777;
}
</style>