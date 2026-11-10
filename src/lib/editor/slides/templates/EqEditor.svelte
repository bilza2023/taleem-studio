<!-- src/lib/editor/slides/templates/EqEditor.svelte -->
<!-- Eq slide: lines (heading / math / text) with side-panel items. No timing controls. -->
<script>
	import { ContentType, EqLineType, EqSidePanelType } from "$lib/taleem-specs/enums";
	import EqJsonPaste from "../components/EqJsonPaste.svelte";

	export let slide;

	const lineTypes = Object.values(EqLineType);
	const spTypes = Object.values(EqSidePanelType);

	// side panels closed by default; tracked per line object
	let spOpen = new Set();

	function toggleSp(line) {
		if (spOpen.has(line)) spOpen.delete(line);
		else spOpen.add(line);
		spOpen = spOpen;
	}

	function addLine(type) {
		slide.data = [
			...slide.data,
			{
				name: ContentType.LINE,
				type,
				content: "",
				showAt: 0,
				spItems: []
			}
		];
	}

	function deleteLine(i) {
		if (slide.data.length <= 1) return;
		slide.data = slide.data.filter((_, idx) => idx !== i);
	}

	function addSpItem(line, type) {
		if (!line.spItems) line.spItems = [];
		line.spItems = [...line.spItems, { type, content: "" }];
		slide.data = [...slide.data];
	}

	function deleteSpItem(line, i) {
		line.spItems = line.spItems.filter((_, idx) => idx !== i);
		slide.data = [...slide.data];
	}
</script>

<EqJsonPaste {slide} />

{#each slide.data as line, i}
	<fieldset>
		<legend>
			<strong>Line {i + 1}</strong>
			{#if line.showAt > 0}
				<span class="time">{Number(line.showAt).toFixed(1)}s</span>
			{/if}
		</legend>

		<div class="type-row">
			<select bind:value={line.type}>
				{#each lineTypes as t}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</div>

		<textarea
			value={line.content}
			on:input={(e) => (line.content = e.target.value)}
			placeholder="Content"
		></textarea>

		<hr />

		<div class="sp-head">
			<button
				type="button"
				class="sp-toggle"
				title={spOpen.has(line) ? "Hide side panel" : "Show side panel"}
				on:click={() => toggleSp(line)}
			>
				{spOpen.has(line) ? "▾" : "▸"}
			</button>

			<h4>Side Panel ({line.spItems?.length ?? 0})</h4>
		</div>

		{#if spOpen.has(line)}
			{#each line.spItems ?? [] as item, j}
				<div class="sp-item">
					<select bind:value={item.type}>
						{#each spTypes as t}
							<option value={t}>{t}</option>
						{/each}
					</select>

					<input
						value={item.content}
						on:input={(e) => (item.content = e.target.value)}
						placeholder="Content"
					/>

					<button on:click={() => deleteSpItem(line, j)}>✖</button>
				</div>
			{/each}
		{/if}

		<div class="line-actions">
			{#if spOpen.has(line)}
				<button class="sp-add text" on:click={() => addSpItem(line, EqSidePanelType.TEXT)}>
					📝 Text
				</button>
				<button class="sp-add math" on:click={() => addSpItem(line, EqSidePanelType.MATH)}>
					∑ Math
				</button>
				<button class="sp-add image" on:click={() => addSpItem(line, EqSidePanelType.IMAGE)}>
					🖼 Image
				</button>
			{/if}

			<button class="delete" on:click={() => deleteLine(i)}>🗑 Delete</button>
		</div>
	</fieldset>
{/each}

<hr />

<div class="add-lines">
	<button on:click={() => addLine(EqLineType.HEADING)}>+ Heading</button>
	<button on:click={() => addLine(EqLineType.MATH)}>+ Math</button>
	<button on:click={() => addLine(EqLineType.TEXT)}>+ Text</button>
</div>

<style>
	fieldset {
		margin-bottom: 20px;
		border: 1px solid var(--theme-border);
		border-radius: 8px;
		padding: 10px 14px 14px;
		background: color-mix(in srgb, var(--theme-panel) 85%, black);
	}

	legend {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 0 6px;
		color: var(--theme-text);
	}

	.time {
		font-family: ui-monospace, monospace;
		font-size: 11px;
		opacity: 0.5;
	}

	.type-row {
		display: flex;
		gap: 10px;
		align-items: center;
		margin-bottom: 10px;
	}

	.type-row select {
		flex: 1;
	}

	select,
	input,
	textarea {
		background: var(--theme-panel);
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		color: var(--theme-text);
		font: inherit;
		padding: 4px 8px;
	}

	select:focus,
	input:focus,
	textarea:focus {
		outline: none;
		border-color: var(--theme-accent);
	}

	textarea {
		width: 100%;
		min-height: 70px;
		box-sizing: border-box;
		padding: 8px 10px;
		resize: vertical;
	}

	hr {
		border: none;
		border-top: 1px solid var(--theme-border);
	}

	h4 {
		color: var(--theme-text);
		font-size: 13px;
	}

	.sp-head {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.sp-head h4 {
		margin: 6px 0;
	}

	.sp-toggle {
		width: 20px;
		height: 20px;
		padding: 0;
		font-size: 11px;
		line-height: 1;
	}

	.sp-item {
		display: flex;
		gap: 8px;
		margin-bottom: 8px;
	}

	.line-actions {
		display: flex;
		gap: 6px;
		margin-top: 10px;
	}

	.add-lines {
		display: flex;
		gap: 8px;
	}

	button {
		background: color-mix(in srgb, var(--theme-panel) 85%, white);
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		color: var(--theme-text);
		cursor: pointer;
	}

	button:hover {
		background: color-mix(in srgb, var(--theme-border) 75%, var(--theme-accent));
	}

	.sp-add,
	.delete {
		color: white;
		font-size: 12px;
		padding: 4px 8px;
	}

	.sp-add.text {
		background: #2563eb;
	}

	.sp-add.math {
		background: #059669;
	}

	.sp-add.image {
		background: #7c3aed;
	}

	.delete {
		margin-left: auto;
		background: #b91c1c;
	}
</style>