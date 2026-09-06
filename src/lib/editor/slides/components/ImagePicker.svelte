<!-- /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/editor/components/ImagePicker.svelte -->

<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send/index.js";
	import { config } from "$lib/config.js";

	export let value = "";
	export let onUse = () => {};

	let files = [];
	let selected = "";

	onMount(load);

	async function load() {
		try {
			const assets = await send("assets", "list", {});

		files = assets.filter(a => a.type === "IMAGE" || a.type === "SVG");

			if (value) {
				selected = value;
			} else if (files.length) {
				selected = files[0].slug;
			}
		}
		catch (err) {
			console.error(err);
		}
	}

	function handleChange() {
		onUse(selected);
	}

	$: previewSrc = selected
		? `${config.basePath}/content/images/${selected}`
		: "";
</script>

<div class="image-picker">

	{#if previewSrc}
		<img class="preview" src={previewSrc} alt={selected} />
	{/if}

	<label>
		<span>Library</span>

		<select bind:value={selected} on:change={handleChange}>
			{#each files as file}
				<option value={file.slug}>
					{file.slug}
				</option>
			{/each}
		</select>
	</label>

</div>

<style>
	.image-picker {
		display: flex;
		align-items: center;
		gap: 7px;
		flex-wrap: wrap;
	}

	.preview {
		width: 44px;
		height: 44px;
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
</style>