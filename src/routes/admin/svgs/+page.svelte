<script>
///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/admin/svg/+page.svelte

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

	async function load() {
		loading = true;
		error = "";

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

		} catch (e) {
			console.error(e);
			alert(e.message);
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
</script>

<div class="page">

	<div class="header">
		<h1>SVGs</h1>
		<div class="count">{total} total</div>
	</div>

	{#if loading}

		<p>Loading...</p>

	{:else if error}

		<p class="error">{error}</p>

	{:else if items.length === 0}

		<p>No SVGs found.</p>

	{:else}

		<div class="grid">

			{#each items as svg}

				<article class="card">

<div class="preview">
	<object
		type="image/svg+xml"
		data={`data:image/svg+xml;utf8,${encodeURIComponent(svg.body)}`}
		aria-label={svg.title || svg.slug}
	></object>
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

						<button onclick={() => deleteSvg(svg.slug)}>
							Delete
						</button>
					</div>

				</article>

			{/each}

		</div>

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

.count {
	opacity: .7;
}

.grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 18px;
}

.card {
	overflow: hidden;
	border: 1px solid #444;
	border-radius: 7px;
	background: #181818;
}

.preview {
	height: 160px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 15px;
	background: white;
	color: #111;
}

.preview img {
	max-width: 100%;
	max-height: 140px;
	object-fit: contain;
}

.preview :global(svg) {
	max-width: 100%;
	max-height: 140px;
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