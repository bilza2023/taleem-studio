<script>
	import { onMount } from "svelte";

	let assets = $state([]);
	let filtered = $state([]);
	let search = $state("");
	let type = $state("ALL");
	let loading = $state(true);
	let error = $state("");
	let active = $state("assets");

	onMount(async () => {
		try {
			const res = await fetch("/assets");

			if (!res.ok) {
				throw new Error("Failed to load assets");
			}

			assets = await res.json();
			filter();
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	});

	function filter() {
		const q = search.toLowerCase().trim();

		filtered = assets.filter(asset => {
			const matchesType = type === "ALL" || asset.type === type;

			const tags = Array.isArray(asset.tags)
				? asset.tags.join(" ")
				: asset.tags || "";

			const text =
				`${asset.slug} ${asset.title || ""} ${tags}`.toLowerCase();

			return matchesType && (!q || text.includes(q));
		});
	}

	function downloadManifest() {
		const manifest = filtered.map(asset => ({
			type: asset.type,
			slug: asset.slug,
			title: asset.title || "",
			description: asset.description || "",
			tags: asset.tags || ""
		}));

		const blob = new Blob(
			[JSON.stringify(manifest, null, 2)],
			{ type: "application/json" }
		);

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
				bind:value={search}
				oninput={filter}
				placeholder="Search slug, title or tags..."
			/>

			<select bind:value={type} onchange={filter}>
				<option value="ALL">All</option>
				<option value="IMAGE">Images</option>
				<option value="SVG">SVG</option>
			</select>

			<button class="download" onclick={downloadManifest}>
				↓ Download Manifest
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
			{filtered.length} assets
		</div>

		<div class="grid">
			{#each filtered as asset}
				<article class="card">
					<div class="preview">
						{#if asset.type === "SVG"}
							{@html asset.body}
						{:else}
							<div class="image-placeholder">IMAGE</div>
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
						<button>Edit</button>
						<button>Delete</button>
					</div>
				</article>
			{/each}
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

	.filters {
		display: flex;
		gap: 10px;
	}

	input,
	select {
		padding: 10px 12px;
		border: 1px solid #aaa;
		border-radius: 5px;
		font: inherit;
	}

	input {
		width: 320px;
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

	.preview :global(svg) {
		max-width: 100%;
		max-height: 140px;
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

	button {
		padding: 7px 12px;
		border: 0;
		border-radius: 4px;
		cursor: pointer;
	}

	.download {
		background: #2563eb;
		color: white;
		white-space: nowrap;
	}

	.download:hover {
		background: #1d4ed8;
	}

	.error {
		color: #ff7777;
	}
</style>