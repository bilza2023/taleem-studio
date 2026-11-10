
<!-- src/lib/editor/slides/components/EditableNumber.svelte -->
<!-- One number field. Shows its time read-only when it has one. -->
<script>
	export let label = "";
	export let object;
	export let property = "value";
	export let min = 0;
	export let max = undefined;
	export let step = 1;

	// Accepted but unused — templates still pass it; removed with the templates cleanup
	export let runningTime = undefined;

	function updateValue(e) {
		object[property] = Number(e.target.value);
	}
</script>

<div class="number-editor">
	<div class="toolbar">
		<strong>{label}</strong>
		{#if object.showAt > 0}
			<span class="time">{Number(object.showAt).toFixed(1)}s</span>
		{/if}
	</div>

	<input type="number" {min} {max} {step} value={object[property]} on:input={updateValue} />
</div>

<style>
	.number-editor {
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

	.number-editor > input {
		width: 120px;
		font: inherit;
		padding: 6px 10px;
		box-sizing: border-box;
		background: color-mix(in srgb, var(--theme-panel) 90%, black);
		border: 1px solid var(--theme-border);
		border-radius: 5px;
		color: var(--theme-text);
	}

	.number-editor > input:focus {
		outline: none;
		border-color: var(--theme-accent);
	}
</style>