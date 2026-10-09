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
		<button
			class="item"
			class:active={value === group.slug}
			onclick={() => onSelect(group.slug)}
		>
			<span class="name">{group.title ?? group.slug}</span>
			<span class="count">{counts[group.slug] ?? 0}</span>
		</button>
	{/each}
</nav>

<style>
	.group-sidebar {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: .5rem;
	}

	/* reset Pico button styles */
	.item {
		all: unset;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: .5rem;
		width: 100%;
		padding: .55rem .75rem;
		border-radius: 8px;
		cursor: pointer;
		color: var(--theme-text);
		font-size: .95rem;
	}

	.item:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.item.active {
		background: var(--theme-accent);
		color: #fff;
		font-weight: 600;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.count {
		flex-shrink: 0;
		font-size: .75rem;
		opacity: .7;
	}
</style>