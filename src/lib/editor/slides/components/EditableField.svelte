
<!-- src/lib/editor/slides/components/EditableField.svelte -->
<!-- One text field. Shows its time read-only when it has one. -->
<script>
	export let label = "";
	export let object;
	export let property = "content";
	export let multiline = true;

	// Accepted but unused — templates still pass it; removed with the templates cleanup
	export let runningTime = undefined;

	function updateText(e) {
		object[property] = e.target.value;
	}
</script>

<div class="field-editor">
	<div class="toolbar">
		<strong>{label}</strong>
		{#if object.showAt > 0}
			<span class="time">{Number(object.showAt).toFixed(1)}s</span>
		{/if}
	</div>

	{#if multiline}
		<textarea rows="3" value={object[property]} on:input={updateText} />
	{:else}
		<input type="text" value={object[property]} on:input={updateText} />
	{/if}
</div>

<style>
	.field-editor {
		margin-bottom: 14px;
	}

	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 6px;
		color: var(--theme-text);
	}

	.time {
		font-family: ui-monospace, monospace;
		font-size: 11px;
		opacity: 0.5;
	}

	textarea,
	input[type="text"] {
		width: 100%;
		font: inherit;
		padding: 8px 10px;
		box-sizing: border-box;
		background: color-mix(in srgb, var(--theme-panel) 90%, black);
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		color: var(--theme-text);
	}

	textarea:focus,
	input[type="text"]:focus {
		outline: none;
		border-color: var(--theme-accent);
	}

	textarea {
		min-height: 70px;
		resize: vertical;
	}
</style>