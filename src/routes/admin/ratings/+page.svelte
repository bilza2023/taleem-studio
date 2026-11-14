<script>
	import { page } from "$app/state";
	import { send } from "$lib/send";

	const courseSlug = page.url.searchParams.get("course");

	let rows = $state([]);          // [{ librarySlug, average, count, title }]
	let optionLabels = $state({});  // key → label
	let loading = $state(true);
	let error = $state("");
	let sortBy = $state("worst");   // worst | most | best

	// detail panel
	let selected = $state(null);    // librarySlug
	let summary = $state(null);
	let comments = $state({ items: [], pages: 1 });
	let commentPage = $state(1);
	let detailLoading = $state(false);
	let detailError = $state("");

	let sorted = $derived.by(() => {
		const list = [...rows];
		if (sortBy === "worst") list.sort((a, b) => a.average - b.average || b.count - a.count);
		if (sortBy === "best") list.sort((a, b) => b.average - a.average || b.count - a.count);
		if (sortBy === "most") list.sort((a, b) => b.count - a.count);
		return list;
	});

	let totals = $derived.by(() => {
		const count = rows.reduce((s, r) => s + r.count, 0);
		const sum = rows.reduce((s, r) => s + r.average * r.count, 0);
		return { decks: rows.length, count, average: count ? Math.round((sum / count) * 10) / 10 : null };
	});

	let selectedRow = $derived(rows.find((r) => r.librarySlug === selected));

	async function load() {
		loading = true;
		error = "";
		try {
			const [byCourse, decks, options] = await Promise.all([
				send("adminRating", "byCourse", { courseSlug }),
				send("library", "studentList", { courseSlug }),
				send("rating", "options", {})
			]);
			const titleOf = Object.fromEntries(decks.map((d) => [d.slug, d.title]));
			rows = byCourse.map((r) => ({ ...r, title: titleOf[r.librarySlug] ?? r.librarySlug }));
			optionLabels = Object.fromEntries((options ?? []).map((o) => [o.key, o.label]));
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function loadDetail() {
		if (!selected) return;
		detailLoading = true;
		detailError = "";
		try {
			const [s, c] = await Promise.all([
				send("adminRating", "summary", { librarySlug: selected }),
				send("adminRating", "list", { courseSlug, librarySlug: selected, page: commentPage, pageSize: 10 })
			]);
			summary = s;
			comments = c;
		} catch (err) {
			detailError = err.message;
		} finally {
			detailLoading = false;
		}
	}

	$effect(() => {
		if (courseSlug) load();
	});

	$effect(() => {
		selected; commentPage;
		loadDetail();
	});

	function open(slug) {
		selected = slug;
		commentPage = 1;
	}

	const starText = (n) => "★".repeat(n) + "☆".repeat(5 - n);
	const tone = (avg) => (avg < 3 ? "bad" : avg < 4 ? "mid" : "good");
	const when = (d) => (d ? new Date(d).toLocaleString() : "");
</script>

{#if !courseSlug}
	<main class="feed">
		<h1>⭐ Ratings</h1>
		<p class="subtitle">Pick a course in "Working on" first.</p>
	</main>
{:else}
	<main class="feed">
		<h1>⭐ Ratings</h1>
		<p class="subtitle">
			<strong>{courseSlug}</strong> ·
			{totals.decks} rated decks · {totals.count} ratings
			{#if totals.average !== null}· average <strong>{totals.average}</strong> ★{/if}
		</p>

		{#if loading}
			<p>Loading…</p>
		{:else if error}
			<p class="error">{error}</p>
		{:else if rows.length === 0}
			<article class="card">No ratings yet for this course.</article>
		{:else}
			<div class="layout">
				<!-- ===== deck list ===== -->
				<section class="card list">
					<div class="list-head">
						<span>Decks</span>
						<div class="tabs">
							<button class="tab" class:active={sortBy === "worst"} onclick={() => (sortBy = "worst")}>Lowest first</button>
							<button class="tab" class:active={sortBy === "most"} onclick={() => (sortBy = "most")}>Most rated</button>
							<button class="tab" class:active={sortBy === "best"} onclick={() => (sortBy = "best")}>Best</button>
						</div>
					</div>

					{#each sorted as r (r.librarySlug)}
						<button class="deck-row" class:active={selected === r.librarySlug} onclick={() => open(r.librarySlug)}>
							<span class="deck-title" title={r.librarySlug}>{r.title}</span>
							<span class="avg {tone(r.average)}">{r.average.toFixed(1)} ★</span>
							<span class="count">{r.count}</span>
						</button>
					{/each}
				</section>

				<!-- ===== detail ===== -->
				<section class="card detail">
					{#if !selected}
						<p class="muted">Select a deck to see its ratings and comments.</p>
					{:else if detailLoading && !summary}
						<p>Loading…</p>
					{:else if detailError}
						<p class="error">{detailError}</p>
					{:else if summary}
						<h2>{selectedRow?.title ?? selected}</h2>
						<p class="muted small">{selected}</p>

						<div class="big">
							<span class="avg {tone(summary.average ?? 0)}">{summary.average ?? "–"} ★</span>
							<span class="muted">{summary.count} ratings</span>
						</div>

						<!-- star spread -->
						<div class="spread">
							{#each [5, 4, 3, 2, 1] as n}
								{@const c = summary.stars[n] ?? 0}
								<div class="bar-row">
									<span class="bar-label">{n} ★</span>
									<div class="bar"><div class="fill" style="width: {summary.count ? (c / summary.count) * 100 : 0}%"></div></div>
									<span class="bar-count">{c}</span>
								</div>
							{/each}
						</div>

						<!-- options -->
						{#if Object.keys(summary.options).length}
							<div class="chips">
								{#each Object.entries(summary.options).sort((a, b) => b[1] - a[1]) as [key, n]}
									<span class="chip" class:warn={key === "hasErrors"}>{optionLabels[key] ?? key} × {n}</span>
								{/each}
							</div>
						{/if}

						<!-- individual ratings -->
						<h3>Ratings</h3>
						{#each comments.items as c (c.id)}
							<div class="comment">
								<div class="comment-head">
									<span class="stars">{starText(c.stars)}</span>
									<span class="muted small">{c.user?.email ?? `#${c.userId}`} · {when(c.updatedAt)}</span>
								</div>
								{#if c.options?.length}
									<div class="chips small-chips">
										{#each c.options as key}<span class="chip" class:warn={key === "hasErrors"}>{optionLabels[key] ?? key}</span>{/each}
									</div>
								{/if}
								{#if c.comment}<p class="comment-text">{c.comment}</p>{/if}
							</div>
						{:else}
							<p class="muted">No ratings.</p>
						{/each}

						{#if comments.pages > 1}
							<div class="pager">
								<button class="ghost" disabled={commentPage <= 1} onclick={() => commentPage--}>← Prev</button>
								<span>Page {commentPage} of {comments.pages}</span>
								<button class="ghost" disabled={commentPage >= comments.pages} onclick={() => commentPage++}>Next →</button>
							</div>
						{/if}
					{/if}
				</section>
			</div>
		{/if}
	</main>
{/if}

<style>
	.feed { width: min(96vw, 1280px); margin: 0 auto; padding: 2rem 1rem; box-sizing: border-box; color: var(--theme-text); }
	h1 { margin-top: 0; }
	h2 { margin: 0; font-size: 1.15rem; }
	h3 { margin: 1.25rem 0 .5rem; font-size: .95rem; }
	.subtitle { margin-bottom: 1.25rem; opacity: .75; }
	.muted { opacity: .65; margin: 0; }
	.small { font-size: .78rem; }
	.error { color: #f87171; }

	.card { padding: 1rem; border: 1px solid var(--theme-border); border-radius: 14px; background: var(--theme-panel); }

	.layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 1rem; align-items: start; }
	@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }

	/* list */
	.list-head { display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin-bottom: .5rem; font-weight: 600; }
	.tabs { display: flex; gap: .3rem; }
	.tab { all: unset; cursor: pointer; padding: .2rem .65rem; border-radius: 999px; border: 1px solid var(--theme-border); font-size: .75rem; font-weight: 400; }
	.tab.active { background: var(--theme-accent); color: #fff; border-color: var(--theme-accent); }

	.deck-row {
		all: unset; box-sizing: border-box; cursor: pointer;
		display: flex; align-items: center; gap: .75rem; width: 100%;
		padding: .55rem .5rem; border-top: 1px solid var(--theme-border); font-size: .9rem;
	}
	.deck-row:hover { background: rgba(255, 255, 255, .04); }
	.deck-row.active { background: rgba(59, 130, 246, .15); }
	.deck-title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.count { width: 2.5rem; text-align: right; opacity: .65; font-size: .8rem; }

	.avg { font-weight: 700; font-variant-numeric: tabular-nums; }
	.avg.good { color: #34d399; }
	.avg.mid { color: #fbbf24; }
	.avg.bad { color: #f87171; }

	/* detail */
	.detail { position: sticky; top: 1rem; }
	.big { display: flex; align-items: baseline; gap: .75rem; margin: .75rem 0; }
	.big .avg { font-size: 1.8rem; }

	.spread { display: grid; gap: .3rem; margin-bottom: .75rem; }
	.bar-row { display: flex; align-items: center; gap: .5rem; font-size: .8rem; }
	.bar-label { width: 2.2rem; opacity: .75; }
	.bar { flex: 1; height: 8px; background: rgba(255, 255, 255, .08); border-radius: 4px; overflow: hidden; }
	.fill { height: 100%; background: #f5b82e; }
	.bar-count { width: 2rem; text-align: right; opacity: .65; }

	.chips { display: flex; flex-wrap: wrap; gap: .4rem; }
	.chip { padding: .15rem .6rem; border-radius: 999px; font-size: .78rem; background: rgba(255, 255, 255, .08); border: 1px solid var(--theme-border); }
	.chip.warn { background: #4a1515; border-color: #7f1d1d; color: #fca5a5; }
	.small-chips .chip { font-size: .7rem; }

	.comment { padding: .65rem 0; border-top: 1px solid var(--theme-border); }
	.comment-head { display: flex; justify-content: space-between; gap: .5rem; align-items: baseline; }
	.stars { color: #f5b82e; letter-spacing: 1px; }
	.comment-text { margin: .4rem 0 0; white-space: pre-wrap; line-height: 1.5; }
	.small-chips { margin-top: .35rem; }

	.pager { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: .75rem; }
	button.ghost { width: auto; margin: 0; padding: .4rem .9rem; border-radius: 6px; background: transparent; border: 1px solid var(--theme-border); color: var(--theme-text); font: inherit; cursor: pointer; }
	button.ghost:disabled { opacity: .5; cursor: default; }
</style>