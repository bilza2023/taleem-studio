<!-- /home/bilal-tariq/00--TALEEM/taleem.studio/src/lib/editor/components/ImagePicker.svelte -->

<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send/index.js";

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

	function useImage() {
		onUse(selected);
	}
</script>

<div class="image-picker">

	<label>
		<span>Current</span>

		<input
			class="current"
			value={value || ""}
			readonly
		/>
	</label>

	<label>
		<span>Library</span>

		<select bind:value={selected}>
			{#each files as file}
				<option value={file.slug}>
					{file.slug}
				</option>
			{/each}
		</select>
	</label>

	<button onclick={useImage}>
		Use
	</button>

</div>

<style>
	.image-picker {
		display: flex;
		align-items: center;
		gap: 7px;
		flex-wrap: wrap;
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

	input[type="text"],
	.current,
	select {
		height: 30px;
		padding: 4px 8px;
		box-sizing: border-box;
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		background: color-mix(in srgb, var(--theme-panel) 90%, black);
		color: var(--theme-text);
		font-size: 12px;
	}

	.current {
		width: 150px;
	}

	select {
		width: 190px;
	}

	button {
		height: 30px;
		padding: 0 14px;
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		background: color-mix(in srgb, var(--theme-panel) 85%, white);
		color: var(--theme-text);
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	button:hover {
		background: color-mix(in srgb, var(--theme-border) 75%, var(--theme-accent));
	}
</style>