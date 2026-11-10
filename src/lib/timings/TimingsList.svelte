<!-- src/lib/timings/TimingsList.svelte -->
<!-- One flat column: a divider per slide, one row per timed item. Display only. -->
<script>
	import ItemPreview from "./ItemPreview.svelte";

	// list:   from buildTapList(deck)
	// cursor: highlighted row
	// marks:  new times by row index (empty for now)
	// onPick: (k) => void, row clicked
	let { deck, list, cursor = 0, marks = [], onPick = () => {} } = $props();

	let rows = [];

	// Keep the highlighted row in view
	$effect(() => {
		rows[cursor]?.scrollIntoView({ block: "center", behavior: "smooth" });
	});

	function oldTime(t) {
		const s = deck.deck[t.slide];
		return t.item === null ? s.start : s.data[t.item]?.showAt;
	}

	const fmt = (v) => (typeof v === "number" ? v.toFixed(1) : "–");
</script>

<div class="list">
	{#each list as t, k (k)}
		{#if k === 0 || list[k - 1].slide !== t.slide}
			<div class="divider">
				<span>Slide {t.slide + 1} · {deck.deck[t.slide].type}</span>
				<span class="start">start {fmt(marks[k] ?? deck.deck[t.slide].start)}</span>
			</div>
		{/if}

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="row"
			class:on={k === cursor}
			role="button"
			tabindex="-1"
			bind:this={rows[k]}
			onclick={() => onPick(k)}
		>
			<span class="time" class:new={marks[k] !== undefined}>{fmt(marks[k] ?? oldTime(t))}</span>
			<span class="content"><ItemPreview slide={deck.deck[t.slide]} index={t.item} /></span>
		</div>
	{/each}
</div>

<style>
	.list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-bottom: 40vh; /* last rows can still scroll to the centre */
	}

	.divider {
		display: flex;
		justify-content: space-between;
		margin-top: 0.9rem;
		padding: 0.3rem 0.6rem;
		border-bottom: 1px solid #2c4590;
		color: #8ea2d8;
		font-size: 0.8rem;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.45rem 0.6rem;
		border-left: 3px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		outline: none;
	}

	.row:hover {
		background: #ffffff08;
	}

	.row.on {
		background: #4f8cff22;
		border-left-color: #4f8cff;
	}

	.time {
		flex: 0 0 4.5ch;
		text-align: right;
		font-family: ui-monospace, monospace;
		font-size: 0.85rem;
		color: #4b5563; /* old time: grey */
	}

	.time.new {
		color: #facc15; /* new mark: bright */
	}

	.content {
		flex: 1;
		min-width: 0;
	}
</style>