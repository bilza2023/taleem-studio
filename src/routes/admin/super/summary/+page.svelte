<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/summary/+page.svelte
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	let rows = $state([]);
	let loading = $state(true);
	let error = $state("");
	let expanded = $state({});
	let sortBy = $state("least");
	let totals = $derived.by(() => {
		const t = {
			courses: rows.length,
			live: 0,
			pub: 0,
			draft: 0,
			archived: 0,
			decks: { pub: 0, total: 0 },
			articles: { pub: 0, total: 0 },
			emptyGroups: 0,
			groupCount: 0,
			noThumb: 0,
			unanswered: 0
		};

		for (const r of okRows) {
			t.live += r.live;
			t.pub += r.PUBLISHED;
			t.draft += r.DRAFT;
			t.archived += r.ARCHIVED;
			t.decks.pub += r.decks.pub;
			t.decks.total += r.decks.total;
			t.articles.pub += r.articles.pub;
			t.articles.total += r.articles.total;
			t.emptyGroups += r.emptyGroups;
			t.groupCount += r.groupCount;
			t.noThumb += r.noThumb;
			t.unanswered += r.unanswered ?? 0;
		}

		t.percent = pct(t.pub, t.draft);
		return t;
	});
	const SORTS = [
		{ value: "least", label: "Least complete" },
		{ value: "most", label: "Most complete" },
		{ value: "unanswered", label: "Unanswered" },
		{ value: "name", label: "Name" }
	];

	// published ÷ (published + draft) — archived is excluded on purpose
	function pct(pub, draft) {
		const d = pub + draft;
		return d ? Math.round((pub / d) * 100) : 0;
	}

	function tier(p, live) {
		if (!live) return "none";
		if (p === 100) return "done";
		if (p >= 67) return "high";
		if (p >= 34) return "mid";
		return "low";
	}

	function summarize(course, groups, items, unanswered) {
		const s = {
			total: 0,
			PUBLISHED: 0,
			DRAFT: 0,
			ARCHIVED: 0,
			noThumb: 0,
			decks: { pub: 0, total: 0 },
			articles: { pub: 0, total: 0 }
		};

		const byGroup = new Map(
			groups.map(g => [
				g.slug,
				{ slug: g.slug, title: g.title ?? g.slug, PUBLISHED: 0, DRAFT: 0, ARCHIVED: 0 }
			])
		);

		let orphans = 0;

		for (const item of items) {
			s.total++;
			s[item.status] = (s[item.status] ?? 0) + 1;
			if (!item.thumbnail) s.noThumb++;

			const bucket =
				item.type === "PLAYER" ? s.decks :
				item.type === "ARTICLE" ? s.articles : null;

			if (bucket && item.status !== "ARCHIVED") {
				bucket.total++;
				if (item.status === "PUBLISHED") bucket.pub++;
			}

			const g = byGroup.get(item.groupSlug);
			if (g) g[item.status] = (g[item.status] ?? 0) + 1;
			else orphans++;
		}

		const groupRows = [...byGroup.values()].map(g => {
			const live = g.PUBLISHED + g.DRAFT;
			return { ...g, live, percent: pct(g.PUBLISHED, g.DRAFT) };
		});

		const live = s.PUBLISHED + s.DRAFT;

		return {
			slug: course.slug,
			title: course.title ?? course.slug,
			...s,
			live,
			percent: pct(s.PUBLISHED, s.DRAFT),
			groups: groupRows,
			groupCount: groupRows.length,
			emptyGroups: groupRows.filter(g => g.live === 0).length,
			orphans,
			unanswered
		};
	}

	async function loadCourse(course) {
		try {
			const [groups, items, unanswered] = await Promise.all([
				send("group", "list", { courseSlug: course.slug }),
				send("adminLibrary", "list", { courseSlug: course.slug }),
				send("adminCommunication", "listUnanswered", { courseSlug: course.slug })
					.catch(() => null)
			]);

			return summarize(
				course,
				groups ?? [],
				items ?? [],
				Array.isArray(unanswered) ? unanswered.length : null
			);
		} catch (err) {
			return {
				slug: course.slug,
				title: course.title ?? course.slug,
				error: err.message
			};
		}
	}

	async function load() {
		loading = true;
		error = "";

		try {
			const courses = await send("course", "list", {});
			rows = await Promise.all((courses ?? []).map(loadCourse));
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function toggle(slug) {
		expanded[slug] = !expanded[slug];
	}

	let okRows = $derived(rows.filter(r => !r.error));

	let sorted = $derived.by(() => {
		const list = [...rows];
		const p = r => (r.error ? -1 : r.percent);

		switch (sortBy) {
			case "most":
				return list.sort((a, b) => p(b) - p(a));
			case "unanswered":
				return list.sort((a, b) => (b.unanswered ?? -1) - (a.unanswered ?? -1));
			case "name":
				return list.sort((a, b) => a.title.localeCompare(b.title));
			default:
				return list.sort((a, b) => p(a) - p(b));
		}
	});

	function courseHref(slug, group) {
		let href = `${config.basePath}/admin/course?course=${encodeURIComponent(slug)}`;
		if (group) href += `&group=${encodeURIComponent(group)}`;
		return href;
	}
</script>

<div class="summary">
	<header class="head">
		<h1>Content summary</h1>

		<div class="tools">
			<select bind:value={sortBy} aria-label="Sort courses">
				{#each SORTS as s}
					<option value={s.value}>{s.label}</option>
				{/each}
			</select>

			<button class="btn" onclick={load} disabled={loading}>
				{loading ? "Loading…" : "↻ Refresh"}
			</button>
		</div>
	</header>

	{#if loading && !rows.length}
		<p class="muted">Loading summary…</p>
	{:else if error}
		<p class="err">{error}</p>
	{:else}
		<section class="stats">
			<div class="stat">
				<span class="label">Courses</span>
				<strong>{totals.courses}</strong>
			</div>
			<div class="stat">
				<span class="label">Live items</span>
				<strong>{totals.live}</strong>
			</div>
			<div class="stat">
				<span class="label">Published</span>
				<strong class="good">{totals.pub}</strong>
			</div>
			<div class="stat">
				<span class="label">Drafts</span>
				<strong class="warn">{totals.draft}</strong>
			</div>
			<div class="stat wide">
				<span class="label">Overall complete</span>
				<div class="bar-line">
					<div class="bar">
						<div
							class={`fill ${tier(totals.percent, totals.live)}`}
							style:width={`${totals.percent}%`}
						></div>
					</div>
					<strong>{totals.percent}%</strong>
				</div>
			</div>
			<div class="stat">
				<span class="label">Unanswered</span>
				<strong class:alert={totals.unanswered > 0}>{totals.unanswered}</strong>
			</div>
		</section>

		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th></th>
						<th>Course</th>
						<th class="col-bar">Complete</th>
						<th class="num">Published</th>
						<th class="num">Draft</th>
						<th class="num">Archived</th>
						<th class="num">Decks</th>
						<th class="num">Articles</th>
						<th class="num">Empty groups</th>
						<th class="num">No thumb</th>
						<th class="num">Unanswered</th>
					</tr>
				</thead>

				<tbody>
					{#each sorted as r (r.slug)}
						{#if r.error}
							<tr>
								<td></td>
								<td>{r.title}</td>
								<td colspan="9" class="err">{r.error}</td>
							</tr>
						{:else}
							<tr class:open={expanded[r.slug]}>
								<td>
									<button
										class="expand"
										onclick={() => toggle(r.slug)}
										aria-label="Show groups"
										aria-expanded={!!expanded[r.slug]}
									>{expanded[r.slug] ? "▾" : "▸"}</button>
								</td>

								<td class="course">
									<a href={courseHref(r.slug)}>{r.title}</a>
									{#if r.orphans}
										<span class="flag" title="Items whose group doesn't exist">
											⚠ {r.orphans} ungrouped
										</span>
									{/if}
								</td>

								<td class="col-bar">
									<div class="bar-line">
										<div class="bar">
											<div
												class={`fill ${tier(r.percent, r.live)}`}
												style:width={`${r.percent}%`}
											></div>
										</div>
										<span class="pct">{r.live ? `${r.percent}%` : "–"}</span>
									</div>
								</td>

								<td class="num good">{r.PUBLISHED}</td>
								<td class="num" class:warn={r.DRAFT > 0}>{r.DRAFT}</td>
								<td class="num muted">{r.ARCHIVED}</td>
								<td class="num">{r.decks.pub}/{r.decks.total}</td>
								<td class="num">{r.articles.pub}/{r.articles.total}</td>
								<td class="num" class:warn={r.emptyGroups > 0}>
									{r.emptyGroups}/{r.groupCount}
								</td>
								<td class="num" class:warn={r.noThumb > 0}>{r.noThumb}</td>
								<td class="num" class:alert={r.unanswered > 0}>
									{r.unanswered ?? "–"}
								</td>
							</tr>

							{#if expanded[r.slug]}
								<tr class="detail">
									<td></td>
									<td colspan="10">
										<div class="groups">
											{#each r.groups as g (g.slug)}
												<a
													class="group"
													class:empty={g.live === 0}
													href={courseHref(r.slug, g.slug)}
												>
													<span class="g-name">{g.title}</span>

													<div class="bar small">
														<div
															class={`fill ${tier(g.percent, g.live)}`}
															style:width={`${g.percent}%`}
														></div>
													</div>

													<span class="g-counts">
														{#if g.live === 0}
															empty
														{:else}
															<span class="good">{g.PUBLISHED}</span>
															/ {g.live}
															{#if g.ARCHIVED}<span class="muted"> · {g.ARCHIVED} arch</span>{/if}
														{/if}
													</span>
												</a>
											{/each}
										</div>
									</td>
								</tr>
							{/if}
						{/if}
					{/each}
				</tbody>
                				<tfoot>
					<tr class="total-row">
						<td></td>
						<td>Total · {totals.courses} courses</td>

						<td class="col-bar">
							<div class="bar-line">
								<div class="bar">
									<div
										class={`fill ${tier(totals.percent, totals.live)}`}
										style:width={`${totals.percent}%`}
									></div>
								</div>
								<span class="pct">{totals.live ? `${totals.percent}%` : "–"}</span>
							</div>
						</td>

						<td class="num good">{totals.pub}</td>
						<td class="num" class:warn={totals.draft > 0}>{totals.draft}</td>
						<td class="num muted">{totals.archived}</td>
						<td class="num">{totals.decks.pub}/{totals.decks.total}</td>
						<td class="num">{totals.articles.pub}/{totals.articles.total}</td>
						<td class="num" class:warn={totals.emptyGroups > 0}>
							{totals.emptyGroups}/{totals.groupCount}
						</td>
						<td class="num" class:warn={totals.noThumb > 0}>{totals.noThumb}</td>
						<td class="num" class:alert={totals.unanswered > 0}>{totals.unanswered}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	{/if}
</div>

<style>
	.summary {
		min-height: 100vh;
		padding: 1rem 1.5rem 3rem;
		box-sizing: border-box;
		background: var(--theme-panel);
		color: var(--theme-text);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.head h1 {
		margin: 0;
		font-size: 1.5rem;
	}

	.tools {
		display: flex;
		gap: .5rem;
		align-items: center;
	}

	.tools select {
		width: auto;
		margin: 0;
		padding: .4rem 2rem .4rem .7rem;
		font-size: .9rem;
	}

	.btn {
		width: auto;
		margin: 0;
		padding: .4rem .9rem;
		font-size: .9rem;
	}

	/* ---------- stat cards ---------- */
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: .75rem;
		margin-bottom: 1.25rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: .3rem;
		padding: .8rem 1rem;
		border: 1px solid var(--theme-border);
		border-radius: 10px;
	}

	.stat.wide {
		grid-column: span 2;
	}

	.stat strong {
		font-size: 1.5rem;
		line-height: 1.1;
	}

	.label {
		font-size: .7rem;
		font-weight: 600;
		letter-spacing: .05em;
		text-transform: uppercase;
		opacity: .65;
	}

	/* ---------- progress bars ---------- */
	.bar-line {
		display: flex;
		align-items: center;
		gap: .6rem;
	}

	.bar {
		flex: 1;
		height: 10px;
		min-width: 80px;
		overflow: hidden;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.1);
	}

	.bar.small {
		height: 6px;
		min-width: 0;
	}

	.fill {
		height: 100%;
		border-radius: 999px;
		transition: width .3s ease;
	}

	.fill.low  { background: #e5534b; }
	.fill.mid  { background: #d4a72c; }
	.fill.high { background: #57ab5a; }
	.fill.done { background: #2ea043; }
	.fill.none { background: transparent; }

	.pct {
		min-width: 3ch;
		font-size: .85rem;
		font-variant-numeric: tabular-nums;
	}

	/* ---------- table ---------- */
	.table-wrap {
		overflow-x: auto;
		border: 1px solid var(--theme-border);
		border-radius: 10px;
	}

	table {
		width: 100%;
		margin: 0;
		border-collapse: collapse;
		font-size: .9rem;
	}

	th, td {
		padding: .55rem .7rem;
		border-bottom: 1px solid var(--theme-border);
		background: transparent;
		color: var(--theme-text);
		white-space: nowrap;
	}

	th {
		font-size: .7rem;
		font-weight: 600;
		letter-spacing: .05em;
		text-transform: uppercase;
		opacity: .7;
		text-align: left;
	}

	.num {
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.col-bar {
		min-width: 180px;
	}

	tr.open > td {
		background: rgba(255, 255, 255, 0.03);
	}

	.course a {
		color: var(--theme-accent);
		font-weight: 600;
		text-decoration: none;
	}

	.course a:hover {
		text-decoration: underline;
	}

	.flag {
		margin-left: .5rem;
		font-size: .75rem;
		color: #d4a72c;
	}

	.expand {
		all: unset;
		cursor: pointer;
		padding: 0 .3rem;
		font-size: .9rem;
		opacity: .8;
	}

	.expand:hover {
		opacity: 1;
	}

	/* ---------- group breakdown ---------- */
	.detail td {
		white-space: normal;
		background: rgba(255, 255, 255, 0.03);
	}

	.groups {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: .5rem;
		padding: .25rem 0 .5rem;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: .35rem;
		padding: .5rem .65rem;
		border: 1px solid var(--theme-border);
		border-radius: 8px;
		color: var(--theme-text);
		text-decoration: none;
		font-size: .85rem;
	}

	.group:hover {
		border-color: var(--theme-accent);
	}

	.group.empty {
		border-style: dashed;
		border-color: #e5534b;
		opacity: .85;
	}

	.g-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 600;
	}

	.g-counts {
		font-size: .75rem;
		opacity: .85;
	}

	/* ---------- text colours ---------- */
	.good  { color: #57ab5a; }
	.warn  { color: #d4a72c; }
	.alert { color: #e5534b; font-weight: 700; }
	.muted { opacity: .55; }
	.err   { color: #e5534b; }

	@media (max-width: 768px) {
		.summary {
			padding: 1rem;
		}

		.stat.wide {
			grid-column: span 1;
		}
	}
    	.total-row td {
		font-weight: 700;
		font-size: .95rem;
		border-top: 2px solid var(--theme-border);
		border-bottom: none;
		background: rgba(255, 255, 255, 0.06);
	}

	.total-row .bar {
		height: 12px;
	}
</style>