<!-- src/lib/editor/slides/components/SlideHeader.svelte -->
<!-- Slide title row: collapse, number, type, read-only times, move/delete. -->
<script>
	export let slide;
	export let index;
	export let collapsed = false;

	export let onToggle = () => {};
	export let onMoveUp = () => {};
	export let onMoveDown = () => {};
	export let onDelete = () => {};

	// Show times only when the slide has real ones (end after start)
	$: timed =
		typeof slide.start === "number" &&
		typeof slide.end === "number" &&
		slide.end > slide.start;

	const fmt = (t) => Number(t).toFixed(1);
</script>

<div class="slide-header">
	<div class="left">
		<button class="icon" on:click={onToggle}>
			{collapsed ? "▶" : "▼"}
		</button>

		<strong>#{index + 1}</strong>

		<span class="type">{slide.type}</span>

		{#if timed}
			<span class="time">{fmt(slide.start)} – {fmt(slide.end)}</span>
		{/if}
	</div>

	<div class="right">
		<button class="icon" on:click={onMoveUp} title="Move up">⬆</button>
		<button class="icon" on:click={onMoveDown} title="Move down">⬇</button>
		<button class="icon" on:click={onDelete} title="Delete slide">🗑</button>
	</div>
</div>

<style>
	.slide-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		background: color-mix(
			in srgb,
			var(--theme-panel) 80%,
			color-mix(in srgb, #f59e0b 45%, #22c55e)
		);
		border-bottom: 1px solid var(--theme-border);
		color: var(--theme-text);
	}

	.left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.right {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.type {
		min-width: 140px;
		color: var(--theme-accent);
	}

	.time {
		font-family: ui-monospace, monospace;
		font-size: 11px;
		opacity: 0.6;
	}

	.icon {
		width: 26px;
		height: 26px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 12px;
		border: 1px solid var(--theme-border);
		border-radius: 4px;
		background: color-mix(in srgb, var(--theme-panel) 85%, white);
		color: var(--theme-text);
		cursor: pointer;
	}

	.icon:hover {
		background: color-mix(in srgb, var(--theme-border) 75%, var(--theme-accent));
	}
</style>