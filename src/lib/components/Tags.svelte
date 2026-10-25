<script>
	// available: { tagName: "meaning" } — supplied by the parent
	let { available = {}, tags = [], onChange } = $props();

	let open = $state(false);

	let knownTags = $derived(Object.keys(available));

	// Unknown tags already on the item are still shown, so they can be removed
	let allTags = $derived([...new Set([...knownTags, ...tags])]);

	function isKnown(tag) {
		return Object.hasOwn(available, tag);
	}

	function toggle(tag) {
		const next = tags.includes(tag)
			? tags.filter((t) => t !== tag)
			: [...tags, tag];

		onChange?.(next);
	}
</script>

<button
	type="button"
	class="tags-toggle"
	aria-expanded={open}
	onclick={() => (open = !open)}
>
	Tags 🏷️
	{#if tags.length}
		<span class="count">{tags.length}</span>
	{/if}
</button>

{#if open}
	<div class="tags-box">
		{#each allTags as tag (tag)}
			{@const active = tags.includes(tag)}
			<button
				type="button"
				class="chip"
				class:active
				class:unknown={!isKnown(tag)}
				title={isKnown(tag) ? available[tag] : "Not in tags list — click to remove"}
				aria-pressed={active}
				onclick={() => toggle(tag)}
			>
				<span class="mark">{active ? "✓" : "+"}</span>
				{tag}
			</button>
		{/each}
	</div>
{/if}

<style>
	.tags-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 20px;
		padding: 6px 12px;
		border: 1px solid #3a4a63;
		border-radius: 6px;
		background: #16202e;
		color: #5fa8ff;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.tags-toggle:hover,
	.tags-toggle[aria-expanded="true"] {
		background: #1e2c40;
		border-color: #5fa8ff;
	}

	.count {
		min-width: 18px;
		padding: 0 6px;
		border-radius: 9px;
		background: #5fa8ff;
		color: #0d1726;
		font-size: 0.75rem;
		line-height: 18px;
		text-align: center;
	}

	.tags-box {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 20px;
		padding: 12px;
		border: 1px solid #3a4a63;
		border-radius: 6px;
		background: #111a26;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border: 1px solid #3a4a63;
		border-radius: 999px;
		background: transparent;
		color: #9fb3cc;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.chip:hover {
		border-color: #5fa8ff;
		color: #dce9ff;
	}

	.chip.active {
		background: #5fa8ff;
		border-color: #5fa8ff;
		color: #0d1726;
		font-weight: 600;
	}

	.chip.unknown {
		border-style: dashed;
	}

	.mark {
		font-size: 0.8rem;
	}
</style>