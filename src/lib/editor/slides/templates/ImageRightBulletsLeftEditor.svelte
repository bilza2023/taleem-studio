<!-- src/lib/editor/slides/templates/ImageRightBulletsLeftEditor.svelte -->

<script>

	import EditableField from "../components/EditableField.svelte";
	import ImagePicker from "../components/ImagePicker.svelte";
	import {ContentType} from "$lib/taleem-specs/enums";

	export let slide;
	export let runningTime;

	function setImageShowAt() {
		slide.data[0].showAt = runningTime;
		slide.data = [...slide.data];
	}

	function updateImageShowAt(e) {
		slide.data[0].showAt = Number(e.target.value);
		slide.data = [...slide.data];
	}

	function useImage(slug) {
		slide.data[0].content = slug;
		slide.data = [...slide.data];
	}

	function addBullet() {

		slide.data = [
			...slide.data,
			{
				name: ContentType.BULLET,
				content: "",
				showAt: 0
			}
		];

	}

	function deleteBullet(index) {

		const bullets = slide.data.filter(
			x => x.name === ContentType.BULLET
		);

		if (bullets.length <= 1) return;

		const bullet = bullets[index];

		slide.data = slide.data.filter(
			x => x !== bullet
		);

	}

</script>

<div class="field-editor">

	<div class="toolbar">

		<strong>Image</strong>

		<div class="showat">

			<span>Show</span>

			<input
				type="number"
				step="0.1"
				min="0"
				value={slide.data[0].showAt ?? 0}
				on:input={updateImageShowAt}
			/>

			<button
				type="button"
				on:click={setImageShowAt}
				title="Use Current Time"
			>
				⏱
			</button>

		</div>

	</div>

	<ImagePicker
		value={slide.data[0].content}
		onUse={useImage}
	/>

</div>

{#each slide.data.filter(x => x.name === ContentType.BULLET) as bullet, i}

	<div style="display:flex; gap:8px; align-items:flex-start; margin-bottom:8px;">

		<div style="flex:1;">

			<EditableField
				label={`Bullet ${i + 1}`}
				object={bullet}
				property="content"
				multiline={false}
				{runningTime}
			/>

		</div>

		<button on:click={() => deleteBullet(i)}>
			✖
		</button>

	</div>

{/each}

<button on:click={addBullet}>
	+ Add Bullet
</button>

<style>
	.field-editor {
		margin-bottom: 12px;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 4px;
	}

	.toolbar strong {
		color: var(--theme-text);
	}

	.showat {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 12px;
		color: var(--theme-text);
	}

	.showat input {
		width: 76px;
		min-width: 76px;
		padding: 2px 4px;
		text-align: right;
		background: var(--theme-panel);
		border: 1px solid var(--theme-border);
		border-radius: 3px;
		color: var(--theme-text);
	}

	.showat button {
		padding: 2px 6px;
		cursor: pointer;
		background: color-mix(in srgb, var(--theme-panel) 85%, white);
		border: 1px solid var(--theme-border);
		border-radius: 3px;
		color: var(--theme-text);
	}
</style>