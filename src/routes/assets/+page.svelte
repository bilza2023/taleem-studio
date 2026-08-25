<script>
	import { onMount } from "svelte";
	import { config } from "$lib/config";

	let assets = $state([]);
	let filtered = $state([]);
	let search = $state("");
	let type = $state("ALL");
	let loading = $state(true);
	let error = $state("");
	let active = $state("assets");


	onMount(async () => {
		try {
			const res = await fetch(`${config.apiUrl}/assets`);

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

			const matchesType =
				type === "ALL" ||
				asset.type === type;

			const tags = Array.isArray(asset.tags)
				? asset.tags.join(" ")
				: asset.tags || "";

			const text =
				`${asset.slug} ${asset.title || ""} ${tags}`
				.toLowerCase();

			return matchesType && (!q || text.includes(q));
		});
	}


	function editUrl(asset) {

		if (asset.type === "IMAGE") {
			return `${config.basePath}/edit/image?slug=${encodeURIComponent(asset.slug)}`;
		}

		if (asset.type === "SVG") {
			return `${config.basePath}/edit/svg?slug=${encodeURIComponent(asset.slug)}`;
		}

		if (asset.type === "AUDIO") {
			return `${config.basePath}/edit/audio?slug=${encodeURIComponent(asset.slug)}`;
		}

		return "#";
	}


	async function deleteAsset(asset) {

		if (!confirm(`Delete ${asset.slug}?`)) {
			return;
		}

		try {

			const endpoint =
				asset.type === "IMAGE"
					? "/edit/image"
					: asset.type === "SVG"
					? "/edit/svg"
					: "/edit/audio";


			const token =
				localStorage.getItem("taleem-admin-token");


			const res = await fetch(
				`${config.apiUrl}${endpoint}?slug=${encodeURIComponent(asset.slug)}`,
				{
					method: "DELETE",
					headers: token
						? {
							Authorization: `Bearer ${token}`
						}
						: {}
				}
			);


			if (!res.ok) {
				throw new Error("Delete failed");
			}


			assets = assets.filter(
				a => !(a.slug === asset.slug && a.type === asset.type)
			);

			filter();


		} catch(error) {

			console.error(error);
			alert(error.message);

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
				<option value="AUDIO">Audio</option>
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

						{:else if asset.type === "IMAGE"}

							<img
								src={`${config.basePath}/content/images/${asset.slug}`}
								alt={asset.title || asset.slug}
							/>

						{:else if asset.type === "AUDIO"}

							<div class="audio-preview">
								🎵
								<span>AUDIO</span>
							</div>

						{:else}

							<div class="image-placeholder">
								ASSET
							</div>

						{/if}

					</div>


					<div class="info">

						<strong>
							{asset.slug}
						</strong>


						{#if asset.title}
							<span>
								{asset.title}
							</span>
						{/if}


						<small>
							{asset.type}
						</small>


						{#if asset.tags}

							<small>
								{asset.tags}
							</small>

						{/if}

					</div>


					<div class="actions">

						<a href={editUrl(asset)}>
							<button>
								Edit
							</button>
						</a>


						<button onclick={() => deleteAsset(asset)}>
							Delete
						</button>

					</div>


				</article>

			{/each}

		</div>

	{/if}

</div>


<style>

.page {
	max-width:1200px;
	margin:40px auto;
	padding:0 24px;
	color:aliceblue;
	font-family:system-ui,sans-serif;
}


.header {
	display:flex;
	justify-content:space-between;
	align-items:center;
	gap:20px;
	margin-bottom:25px;
}


.filters {
	display:flex;
	gap:10px;
}


input,
select {
	padding:10px 12px;
	border:1px solid #aaa;
	border-radius:5px;
	font:inherit;
}


input {
	width:320px;
}


.count {
	margin-bottom:15px;
	opacity:.7;
}


.grid {
	display:grid;
	grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
	gap:18px;
}


.card {
	overflow:hidden;
	border:1px solid #444;
	border-radius:7px;
	background:#181818;
}


.preview {
	height:160px;
	display:flex;
	align-items:center;
	justify-content:center;
	padding:15px;
	background:white;
	color:#111;
}


.preview img {
	max-width:100%;
	max-height:140px;
	object-fit:contain;
}


.preview :global(svg) {
	max-width:100%;
	max-height:140px;
}


.audio-preview {
	display:flex;
	flex-direction:column;
	align-items:center;
	font-size:40px;
	color:#555;
}


.audio-preview span {
	font-size:14px;
}


.image-placeholder {
	color:#777;
}


.info {
	display:grid;
	gap:5px;
	padding:12px;
}


.info strong {
	overflow-wrap:anywhere;
}


.info small {
	opacity:.65;
}


.actions {
	display:flex;
	gap:8px;
	padding:0 12px 12px;
}


.actions a {
	text-decoration:none;
}


button {
	padding:7px 12px;
	border:0;
	border-radius:4px;
	cursor:pointer;
}


.download {
	background:#2563eb;
	color:white;
	white-space:nowrap;
}


.download:hover {
	background:#1d4ed8;
}


.error {
	color:#ff7777;
}

</style>