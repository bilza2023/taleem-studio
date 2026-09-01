<!-- src/lib/editor/slides/templates/KeyIdeasEditor.svelte -->

<script>

	import Icons from "../assets/Icons.js";
	import EditableField from "../components/EditableField.svelte";
	import {ContentType} from "$lib/taleem-specs/enums";

	export let slide;
	export let runningTime;

	const iconList = Object.values(Icons);

	let openIndex = null;

	function togglePicker(i) {
		openIndex = openIndex === i ? null : i;
	}

	function pickIcon(i, icon) {
		slide.data[i].icon = icon;
		slide.data = [...slide.data];
		openIndex = null;
	}

	function addCard() {

		if (slide.data.length >= 4) return;

		slide.data = [
			...slide.data,
			{
				name: ContentType.CARD,
				icon: iconList[0],
				label: "",
				showAt: 0
			}
		];

	}

	function deleteCard(index) {

		if (slide.data.length <= 1) return;

		slide.data = slide.data.filter((_, i) => i !== index);

		if (openIndex === index) openIndex = null;

	}

</script>

{#each slide.data as card, i}

	<div class="idea-row">

		<div class="icon-picker">

			<button
				type="button"
				class="icon-current"
				on:click={() => togglePicker(i)}
			>
				{card.icon}
			</button>

			{#if openIndex === i}

				<div class="icon-overlay" on:click={() => (openIndex = null)}></div>

				<div class="icon-grid">
					{#each iconList as icon}
						<button
							type="button"
							class="icon-option"
							class:selected={icon === card.icon}
							on:click={() => pickIcon(i, icon)}
						>
							{icon}
						</button>
					{/each}
				</div>

			{/if}

		</div>

		<div class="idea-field">

			<EditableField
				label={`Idea ${i + 1}`}
				object={card}
				property="label"
				multiline={false}
				{runningTime}
			/>

		</div>

		<button class="delete" on:click={() => deleteCard(i)}>
			✖
		</button>

	</div>

{/each}

<button class="add-idea" on:click={addCard}>
	+ Add Idea
</button>

<style>

	.idea-row {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		margin-bottom: 14px;
	}

	.icon-picker {
		position: relative;
		flex-shrink: 0;
	}

	.icon-current {
		width: 64px;
		height: 64px;
		font-size: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: color-mix(in srgb, var(--theme-panel) 90%, black);
		border: 1px solid var(--theme-border);
		border-radius: 10px;
		color: var(--theme-text);
		cursor: pointer;
	}

	.icon-current:hover {
		border-color: var(--theme-accent);
	}

	.icon-overlay {
		position: fixed;
		inset: 0;
		z-index: 10;
	}

	.icon-grid {
		position: absolute;
		top: 72px;
		left: 0;
		z-index: 20;
		width: 320px;
		max-height: 280px;
		overflow-y: auto;
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 6px;
		padding: 10px;
		background: color-mix(in srgb, var(--theme-panel) 92%, black);
		border: 1px solid var(--theme-border);
		border-radius: 10px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
	}

	.icon-option {
		width: 44px;
		height: 44px;
		font-size: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 8px;
		cursor: pointer;
	}

	.icon-option:hover {
		background: color-mix(in srgb, var(--theme-border) 60%, var(--theme-accent));
	}

	.icon-option.selected {
		border-color: var(--theme-accent);
		background: color-mix(in srgb, var(--theme-border) 40%, var(--theme-accent));
	}

	.idea-field {
		flex: 1;
	}

	.delete {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		padding: 0;
		background: color-mix(in srgb, var(--theme-panel) 85%, white);
		border: 1px solid var(--theme-border);
		border-radius: 6px;
		color: var(--theme-text);
		cursor: pointer;
	}

	.delete:hover {
		background: var(--editor-danger, #ef4444);
		color: #fff;
		border-color: var(--editor-danger, #ef4444);
	}

	.add-idea {
		padding: 8px 14px;
		background: color-mix(in srgb, var(--theme-panel) 85%, white);
		border: 1px solid var(--theme-border);
		border-radius: 6px;
		color: var(--theme-text);
		cursor: pointer;
	}

	.add-idea:hover {
		background: color-mix(in srgb, var(--theme-border) 75%, var(--theme-accent));
	}

</style>