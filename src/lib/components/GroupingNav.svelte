<script>
	export let groupings = [];
	export let value = "";
	export let onChange = () => {};

	let groups = [];

	function bySortOrder(a, b) {
		return (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
			|| (a.id ?? 0) - (b.id ?? 0);
	}

	$: {
		let list;
		try {
			list = Array.isArray(groupings)
				? groupings
				: JSON.parse(groupings || "[]");
		}
		catch {
			list = [];
		}
		groups = [...list].sort(bySortOrder);
	}

	function selectGrouping(event) {
		onChange(event.currentTarget.value);
	}
</script>

<select value={value} onchange={selectGrouping}>
	<option value="">All</option>

	{#each groups as grouping}
		<option value={grouping.slug}>
			{grouping.title}
		</option>
	{/each}
</select>

<style>
	select {
		width: 100%;
		padding: .65rem .8rem;
		margin: 0 0 1rem;
		background: var(--theme-panel);
		color: var(--theme-text);
		border: 1px solid var(--theme-border);
		border-radius: 7px;
		font-size: 1rem;
		cursor: pointer;
	}
</style>