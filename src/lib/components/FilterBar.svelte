<script>
	const STATUSES = [
		{ value: "", label: "All" },
		{ value: "DRAFT", label: "📝 Draft" },
		{ value: "PUBLISHED", label: "✅ Published" },
		{ value: "ARCHIVED", label: "🗄️ Archived" }
	];

	let {
		search = "",
		status = "",
		tag = "",
		counts = { total: 0, status: {}, tags: {} },
		shown = 0,
		tagsList = {},
		onSearch,
		onStatus,
		onTag
	} = $props();

	let tagNames = $derived(Object.keys(tagsList));
</script>

<div class="filter-bar">
	<input
		type="search"
		placeholder="Search title or slug…"
		value={search}
		oninput={(e) => onSearch?.(e.currentTarget.value)}
		onkeydown={(e) => e.key === "Escape" && onSearch?.("")}
	/>

	<div class="group">
		{#each STATUSES as s (s.value)}
			<button
				type="button"
				class="chip"
				class:active={status === s.value}
				aria-pressed={status === s.value}
				onclick={() => onStatus?.(s.value)}
			>
				{s.label}
				<small>{s.value ? (counts.status[s.value] ?? 0) : counts.total}</small>
			</button>
		{/each}
	</div>

	{#if tagNames.length}
		<select
			class="tag-select"
			class:active={!!tag}
			value={tag}
			title={tag ? tagsList[tag] : "Filter by tag"}
			onchange={(e) => onTag?.(e.currentTarget.value)}
		>
			<option value="">🏷️ All tags</option>
			{#each tagNames as name (name)}
				<option value={name}>
					{name} ({counts.tags[name] ?? 0})
				</option>
			{/each}
		</select>
	{/if}

	<span class="shown">{shown} shown</span>
</div>

<style>
	.filter-bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 8px;
		margin: 0 0 0.5rem;
	}

	.group {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	input {
		flex: 1;
		min-width: 220px;
		max-width: 420px;
		padding: 0.55rem 0.8rem;
		font: inherit;
		color: var(--theme-text);
		background: var(--theme-panel);
		border: 1px solid var(--theme-border);
		border-radius: 7px;
	}

	input:focus {
		outline: none;
		border-color: #5fa8ff;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 0.45rem 0.75rem;
		font: inherit;
		font-size: 0.9rem;
		color: var(--theme-text);
		background: transparent;
		border: 1px solid var(--theme-border);
		border-radius: 999px;
		cursor: pointer;
	}

	.chip small {
		opacity: 0.7;
		font-size: 0.75rem;
	}

	.chip:hover {
		border-color: #5fa8ff;
	}

	.chip.active {
		background: rgba(95, 168, 255, 0.2);
		border-color: #5fa8ff;
	}

	/* tag dropdown — amber when a tag is selected */
	.tag-select {
		width: auto;
		min-width: 170px;
		margin: 0;
		padding: 0.45rem 0.75rem;
		font: inherit;
		font-size: 0.9rem;
		color: var(--theme-text);
		background-color: var(--theme-panel);
		border: 1px solid var(--theme-border);
		border-radius: 999px;
		cursor: pointer;
	}

	.tag-select:hover,
	.tag-select:focus {
		outline: none;
		border-color: #5fa8ff;
	}

	.tag-select.active {
		border-color: #e3b341;
		background-color: rgba(227, 179, 65, 0.15);
	}

	.tag-select option {
		color: var(--theme-text);
		background: var(--theme-panel);
	}

	.shown {
		margin-left: auto;
		opacity: 0.7;
		font-size: 0.85rem;
	}
</style>