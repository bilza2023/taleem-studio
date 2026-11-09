<!-- /home/bilal-tariq/00--TALEEM/taleem/src/routes/test-results/+page.svelte -->
<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import ReportCard from "$lib/mcq/ReportCard.svelte";

	const PAGE_SIZE = 20;

	let pageNo = $state(1);
	let data = $state(null); // { items, total, page, pages }
	let loading = $state(true);
	let error = $state(null);
	let selected = $state(null); // one item → full report view

	async function load(p) {
		loading = true;
		error = null;
		try {
			data = await send("analytics", "myMcqResults", { page: p, pageSize: PAGE_SIZE }, "user");
			pageNo = data.page;
		} catch (e) {
			console.error(e);
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}

	function open(item) {
		selected = item;
		window.scrollTo(0, 0);
	}

	function back() {
		selected = null;
	}

	const fmtDate = (d) =>
		new Date(d).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" });

	onMount(() => {
		load(1);
	});
</script>

<main class="results">
	{#if selected}
		<!-- ── One result: full report ── -->
		<header class="detail-head">
			<button type="button" class="ghost" onclick={back}>← All results</button>
			<div>
				<h1>{selected.title}</h1>
				<p class="muted">{fmtDate(selected.createdAt)}</p>
			</div>
		</header>

		{#if selected.report}
			<ReportCard report={selected.report} />
		{:else}
			<p class="muted">This result could not be read.</p>
		{/if}
	{:else}
		<!-- ── List ── -->
		<h1>My test results</h1>

		{#if loading && !data}
			<p class="muted">Loading…</p>
		{:else if error}
			<p class="error">{error}</p>
		{:else if !data?.items.length}
			<p class="muted">No results yet. Finish a test and it will appear here.</p>
		{:else}
			<p class="muted">{data.total} result{data.total === 1 ? "" : "s"}</p>

			<ul class="list">
				{#each data.items as item (item.id)}
					{@const r = item.report}
					<li>
						<button type="button" class="row" onclick={() => open(item)}>
							<span class="pct">{r?.score?.percent ?? "—"}%</span>
							<span class="info">
								<strong>{item.title}</strong>
								<span class="muted">
									{fmtDate(item.createdAt)} ·
									<span class="mode {r?.mode}">{r?.mode === "test" ? "Test" : "Practice"}</span>
								</span>
							</span>
							<span class="pts">
								{r?.score?.earned ?? 0} / {r?.score?.total ?? 0}
							</span>
						</button>
					</li>
				{/each}
			</ul>

			{#if data.pages > 1}
				<nav class="pager">
					<button type="button" disabled={pageNo <= 1 || loading} onclick={() => load(pageNo - 1)}>
						← Prev
					</button>
					<span>Page {pageNo} / {data.pages}</span>
					<button type="button" disabled={pageNo >= data.pages || loading} onclick={() => load(pageNo + 1)}>
						Next →
					</button>
				</nav>
			{/if}
		{/if}
	{/if}
</main>

<style>
	.results {
		/* Same palette Mcq.svelte sets — ReportCard reads these variables */
		--mcq-bg: #0a1230;
		--mcq-card: #111c44;
		--mcq-card-hi: #172457;
		--mcq-border: #2c4590;
		--mcq-accent: #4f8cff;
		--mcq-accent-soft: rgba(79, 140, 255, 0.18);
		--mcq-text: #e8eeff;
		--mcq-muted: #8ea2d8;
		--mcq-ok: #22c55e;
		--mcq-ok-soft: rgba(34, 197, 94, 0.16);
		--mcq-bad: #ef4444;
		--mcq-bad-soft: rgba(239, 68, 68, 0.16);
		--mcq-radius: 12px;

		max-width: 900px;
		margin: 0 auto;
		padding: 1rem;
		color: var(--mcq-text);
	}

	h1 {
		font-size: 1.4rem;
		margin: 0.5rem 0;
	}
	.muted {
		color: var(--mcq-muted);
		margin: 0.25rem 0 1rem;
	}
	.error {
		color: var(--mcq-bad);
	}

	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.list li {
		list-style: none;
	}
	.row {
		width: 100%;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem 1rem;
		text-align: left;
		background: var(--mcq-card);
		border: 1px solid var(--mcq-border);
		border-radius: var(--mcq-radius);
		color: var(--mcq-text);
		cursor: pointer;
	}
	.row:hover {
		background: var(--mcq-card-hi);
		border-color: var(--mcq-accent);
	}
	.pct {
		min-width: 3.5rem;
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--mcq-accent);
	}
	.info {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.info .muted {
		margin: 0;
		font-size: 0.85rem;
	}
	.mode.test {
		color: #f59e0b;
	}
	.pts {
		font-variant-numeric: tabular-nums;
		color: var(--mcq-muted);
	}

	.pager {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
		margin-top: 1rem;
	}
	.pager button,
	.ghost {
		width: auto;
		margin: 0;
		padding: 0.4rem 1rem;
	}

	.detail-head {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.detail-head h1 {
		margin: 0;
	}
	.detail-head .muted {
		margin: 0;
	}
</style>