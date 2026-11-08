<script>
	let { groups = [], counts = {}, total = 0, value = "", onSelect } = $props();
</script>

<nav class="group-sidebar">
	<button
		class="item"
		class:active={!value}
		onclick={() => onSelect("")}
	>
		<span class="name">All lessons</span>
		<span class="count">{total}</span>
	</button>

	{#each groups as group (group.slug)}
		{@const count = counts[group.slug] ?? 0}
		<button
			class="item"
			class:active={value === group.slug}
			class:empty={count === 0}
			onclick={() => onSelect(group.slug)}
		>
			<span class="name">{group.title ?? group.slug}</span>
			{#if count > 0}
				<span class="count">{count}</span>
			{/if}
		</button>
	{/each}
</nav>


<style>
	.group-sidebar {
		display: flex;
		flex-direction: column;
		gap: 0;
		padding: .5rem .75rem;
		font-family: Georgia, "Times New Roman", serif;
	}

	/* reset Pico button styles */
	.item {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: .5rem;
		width: 100%;
		padding: .6rem .5rem;
				border-top: 1px solid rgba(255, 255, 255, 0.22);
		cursor: pointer;
		color: var(--theme-text);
		font-size: .95rem;
		letter-spacing: .01em;
	}

	.item:last-child {
				border-bottom: 1px solid rgba(255, 255, 255, 0.22);
	}

	/* "All lessons" works like the heading of a contents page */
	.item:first-child {
		border-top: none;
		border-bottom: 3px double rgba(255, 255, 255, 0.25);
		margin-bottom: .25rem;
		font-weight: 600;
	}

	/* no top rule right after the heading's double rule */
	.item:first-child + .item {
		border-top: none;
	}

	.item:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	/* empty groups are dimmed but still clickable */
	.item.empty:not(.active) {
		opacity: .45;
	}

	.item.empty:not(.active):hover {
		opacity: .7;
	}

	.item.active {
		background: var(--theme-accent);
		color: #fff;
		font-weight: 600;
		border-radius: 4px;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* counts read like page numbers */
	.count {
		flex-shrink: 0;
		font-size: .8rem;
		font-style: italic;
		font-variant-numeric: tabular-nums;
		opacity: .75;
	}
</style>