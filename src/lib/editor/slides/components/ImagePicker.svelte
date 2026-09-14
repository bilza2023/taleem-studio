<!-- /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/editor/components/ImagePicker.svelte -->

<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send/index.js";
	import { config } from "$lib/config.js";

	export let value = "";
	export let onUse = () => {};
	export let svgEditRoute = "/admin/edit/svg";
	export let imageEditRoute = "/admin/edit/image";

	let files = [];
	let selected = "";
	let sortMode = "recent"; // "recent" | "alphabetical"

	onMount(load);

	async function load() {
		try {
			const assets = await send("assets", "list", {});

			files = assets.filter(a => a.type === "IMAGE" || a.type === "SVG");

			if (!value && files.length) {
				selected = files[0].slug;
			}
		}
		catch (err) {
			console.error(err);
		}
	}

	$: if (value) selected = value;

	function sortFiles(list, mode) {
		const sorted = [...list];

		if (mode === "recent") {
			sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
		} else {
			sorted.sort((a, b) => a.slug.localeCompare(b.slug));
		}

		return sorted;
	}

	function toggleSort() {
		sortMode = sortMode === "recent" ? "alphabetical" : "recent";
	}

	function handleChange() {
		onUse(selected);
	}

	$: svgFiles = sortFiles(files.filter(f => f.type === "SVG"), sortMode);
	$: imageFiles = sortFiles(files.filter(f => f.type === "IMAGE"), sortMode);

	$: previewSrc = selected
		? `${config.basePath}/content/images/${selected}`
		: "";

	$: selectedFile = files.find(f => f.slug === selected);

	$: editHref = selectedFile
		? selectedFile.type === "SVG"
			? `${svgEditRoute}?slug=${encodeURIComponent(selectedFile.slug)}`
			: `${imageEditRoute}?slug=${encodeURIComponent(selectedFile.slug)}`
		: "";
</script>

<div class="image-picker">

	{#if previewSrc}
		<img class="preview" src={previewSrc} alt={selected} />
	{/if}

	<label>
		<span>Library</span>

		<select bind:value={selected} on:change={handleChange}>
			<optgroup label="SVG">
				{#each svgFiles as file}
					<option value={file.slug}>
						{file.slug}
					</option>
				{/each}
			</optgroup>

			<optgroup label="Image">
				{#each imageFiles as file}
					<option value={file.slug}>
						{file.slug}
					</option>
				{/each}
			</optgroup>
		</select>
	</label>

	<button
		type="button"
		class="sort-toggle"
		on:click={toggleSort}
		title={sortMode === "recent" ? "Sorted by recent — click for A–Z" : "Sorted A–Z — click for recent"}
	>
		{sortMode === "recent" ? "🕓" : "🔤"}
	</button>

	{#if editHref}
		<a class="edit-link" href={editHref} target="_blank" rel="noopener" title="Edit this asset">
			✎
		</a>
	{/if}

</div>

<style>
	.image-picker {
		display: flex;
		align-items: center;
		gap: 7px;
		flex-wrap: wrap;
	}

	.preview {
		width: 72px;
		height: 72px;
		object-fit: cover;
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		background: color-mix(in srgb, var(--theme-panel) 90%, black);
	}

	label {
		display: flex;
		align-items: center;
		gap: 7px;
		white-space: nowrap;
	}

	label > span {
		color: var(--theme-text);
		opacity: 0.7;
		font-size: 12px;
	}

	select {
		height: 30px;
		padding: 4px 8px;
		box-sizing: border-box;
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		background: color-mix(in srgb, var(--theme-panel) 90%, black);
		color: var(--theme-text);
		font-size: 12px;
		width: 190px;
	}

	optgroup {
		color: var(--theme-accent);
		font-weight: 700;
		font-style: normal;
	}

	.sort-toggle {
		height: 30px;
		width: 34px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		background: color-mix(in srgb, var(--theme-panel) 90%, black);
		color: var(--theme-text);
		font-size: 16px;
		cursor: pointer;
	}

	.sort-toggle:hover {
		background: color-mix(in srgb, var(--theme-panel) 80%, black);
	}

	.edit-link {
		height: 30px;
		width: 34px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		background: color-mix(in srgb, var(--theme-panel) 90%, black);
		color: var(--theme-accent);
		font-size: 16px;
		text-decoration: none;
		cursor: pointer;
	}

	.edit-link:hover {
		background: color-mix(in srgb, var(--theme-panel) 80%, black);
	}
</style>