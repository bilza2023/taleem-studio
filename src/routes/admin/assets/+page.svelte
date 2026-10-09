<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/assets/+page.svelte
	import { onMount } from "svelte";
	import { config } from "$lib/config";
	import { send } from "$lib/send";

	const PAGE_SIZE = 30;

	let assets = $state([]);
	let search = $state("");
	let type = $state("ALL");
	let page = $state(1);
	let loading = $state(true);
	let error = $state("");

	// all matches (used by the manifest too)
	let filtered = $derived.by(() => {
		const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

		return assets
			.filter(asset => {
				if (type !== "ALL" && asset.type !== type) return false;

				const tags = Array.isArray(asset.tags) ? asset.tags.join(" ") : asset.tags || "";
				const hay = `${asset.slug} ${asset.title || ""} ${tags}`.toLowerCase();

				return words.every(w => hay.includes(w));
			})
			.sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0));
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));

	// clamp: deleting the last item on the last page shouldn't leave an empty page
	let current = $derived(Math.min(page, totalPages));

	let shown = $derived(
		filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
	);

	onMount(async () => {
		try {
			assets = await send("assets", "list", {});
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	});

	function resetPage() {
		page = 1;
	}

	function goTo(n) {
		page = Math.min(Math.max(1, n), totalPages);
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	function previewUrl(asset) {
		return `${config.basePath}/content/images/${asset.slug}`;
	}

	function editUrl(asset) {
		const kind = { IMAGE: "image", SVG: "svg", AUDIO: "audio" }[asset.type];
		return kind
			? `${config.basePath}/admin/edit/${kind}?slug=${encodeURIComponent(asset.slug)}`
			: "#";
	}

	async function deleteAsset(asset) {
		if (!confirm(`Delete ${asset.slug}?`)) return;

		const kind = { IMAGE: "image", SVG: "svg", AUDIO: "audio" }[asset.type];

		try {
			if (!kind) throw new Error(`Unknown asset type: ${asset.type}`);

			await send(kind, "delete", { slug: asset.slug });

			assets = assets.filter(
				a => !(a.slug === asset.slug && a.type === asset.type)
			);
		} catch (err) {
			console.error(err);
			alert(err.message);
		}
	}

	function downloadManifest() {
		const manifest = filtered.map(asset => ({
			type: asset.type,
			slug: asset.slug,
			title: asset.title || "",
			description: asset.description || "",
			tags: asset.tags || ""
		}));

		const blob = new Blob([JSON.stringify(manifest, null, 2)], {
			type: "application/json"
		});

		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "asset-manifest.json";
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="page">
	<div class="header">
		<h1>Assets</h1>

		<div class="filters">
			<input
				type="search"
				bind:value={search}
				oninput={resetPage}
				onkeydown={(e) => e.key === "Escape" && ((search = ""), resetPage())}
				placeholder="Search slug, title or tags..."
			/>

			<select bind:value={type} onchange={resetPage}>
				<option value="ALL">All</option>
				<option value="IMAGE">Images</option>
				<option value="SVG">SVG</option>
				<option value="AUDIO">Audio</option>
			</select>

			<button class="download" onclick={downloadManifest} disabled={!filtered.length}>
				↓ Manifest ({filtered.length})
			</button>
		</div>
	</div>

	{#if loading}
		<p>Loading...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if filtered.length === 0}
		<p>No assets found.</p>
	{:else}
		<div class="count">
			{filtered.length} assets · page {current} of {totalPages}
		</div>

		<div class="grid">
			{#each shown as asset (`${asset.type}:${asset.slug}`)}
				<article class="card">
					<div class="preview">
						{#if asset.type === "SVG" || asset.type === "IMAGE"}
							<a href={previewUrl(asset)} target="_blank" rel="noopener noreferrer">
								<img
									src={previewUrl(asset)}
									alt={asset.title || asset.slug}
									loading="lazy"
									decoding="async"
								/>
							</a>
						{:else if asset.type === "AUDIO"}
							<div class="audio-preview">
								🎵
								<span>AUDIO</span>
							</div>
						{:else}
							<div class="image-placeholder">ASSET</div>
						{/if}
					</div>

					<div class="info">
						<strong>{asset.slug}</strong>

						{#if asset.title}
							<span>{asset.title}</span>
						{/if}

						<small>{asset.type}</small>

						{#if asset.tags}
							<small>{asset.tags}</small>
						{/if}
					</div>

					<div class="actions">
						<a href={editUrl(asset)}>
							<button>Edit</button>
						</a>

						<button onclick={() => deleteAsset(asset)}>Delete</button>
					</div>
				</article>
			{/each}
		</div>

		{#if totalPages > 1}
			<div class="pagination">
				<button onclick={() => goTo(current - 1)} disabled={current <= 1}>
					← Prev
				</button>

				<span>Page {current} of {totalPages}</span>

				<button onclick={() => goTo(current + 1)} disabled={current >= totalPages}>
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
		flex-wrap: wrap;
		gap: 20px;
		margin-bottom: 25px;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}

	input,
	select {
		margin: 0;
		padding: 10px 12px;
		border: 1px solid #aaa;
		border-radius: 5px;
		font: inherit;
	}

	input {
		width: 320px;
	}

	select {
		width: auto;
	}

	.count {
		margin-bottom: 15px;
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

	.preview a {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.preview img {
		max-width: 100%;
		max-height: 140px;
		object-fit: contain;
	}

	.audio-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		font-size: 40px;
		color: #555;
	}

	.audio-preview span {
		font-size: 14px;
	}

	.image-placeholder {
		color: #777;
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
		width: auto;
		margin: 0;
		padding: 7px 12px;
		border: 0;
		border-radius: 4px;
		cursor: pointer;
	}

	button:disabled {
		opacity: .5;
		cursor: default;
	}

	.download {
		background: #2563eb;
		color: white;
		white-space: nowrap;
	}

	.download:hover:not(:disabled) {
		background: #1d4ed8;
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