<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/analytics/+page.svelte
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	let report = $state(null);
	let loading = $state(true);
	let error = $state("");
	let expanded = $state({});
	let days = $state(30);
	let sortBy = $state("most");

	const PERIODS = [
		{ value: 7, label: "Last 7 days" },
		{ value: 30, label: "Last 30 days" },
		{ value: 90, label: "Last 90 days" },
		{ value: 0, label: "All time" }
	];

	const SORTS = [
		{ value: "most", label: "Most opens" },
		{ value: "least", label: "Least opens" },
		{ value: "students", label: "Most students" },
		{ value: "name", label: "Name" }
	];

	async function load() {
		loading = true;
		error = "";
		try {
			report = await send("adminAnalytics", "summary", { days });
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

	let sorted = $derived.by(() => {
		const list = [...(report?.courses ?? [])];
		switch (sortBy) {
			case "least":
				return list.sort((a, b) => a.opens.total - b.opens.total);
			case "students":
				return list.sort((a, b) => b.uniqueStudents - a.uniqueStudents);
			case "name":
				return list.sort((a, b) => a.title.localeCompare(b.title));
			default:
				return list.sort((a, b) => b.opens.total - a.opens.total);
		}
	});

	function playerHref(slug) {
		return `${config.basePath}/admin/player?lesson=${encodeURIComponent(slug)}`;
	}
</script>

<div class="summary">
	<header class="head">
		<h1>Analytics</h1>

		<div class="tools">
			<select bind:value={days} onchange={load} aria-label="Period">
				{#each PERIODS as p}
					<option value={p.value}>{p.label}</option>
				{/each}
			</select>

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

	{#if loading && !report}
		<p class="muted">Loading analytics…</p>
	{:else if error}
		<p class="err">{error}</p>
	{:else if report}
		<section class="stats">
			<div class="stat">
				<span class="label">Lesson opens</span>
				<strong>{report.totals.opens.total}</strong>
			</div>
			<div class="stat">
				<span class="label">Unique students</span>
				<strong class="good">{report.totals.uniqueStudents}</strong>
			</div>
			<div class="stat">
				<span class="label">Student opens</span>
				<strong>{report.totals.opens.student}</strong>
			</div>
			<div class="stat">
				<span class="label">Anonymous</span>
				<strong class="warn">{report.totals.opens.anonymous}</strong>
			</div>
			<div class="stat">
				<span class="label">Admin</span>
				<strong class="muted">{report.totals.opens.admin}</strong>
			</div>
		</section>

		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th></th>
						<th>Course</th>
						<th class="num">Opens</th>
						<th class="num">Students</th>
						<th class="num">Student opens</th>
						<th class="num">Anonymous</th>
						<th class="num">Admin</th>
						<th class="num">Lessons opened</th>
					</tr>
				</thead>

				<tbody>
					{#each sorted as r (r.courseSlug)}
						<tr class:open={expanded[r.courseSlug]}>
							<td>
								{#if r.lessons.length}
									<button
										class="expand"
										onclick={() => toggle(r.courseSlug)}
										aria-label="Show lessons"
										aria-expanded={!!expanded[r.courseSlug]}
									>{expanded[r.courseSlug] ? "▾" : "▸"}</button>
								{/if}
							</td>
							<td class="course">{r.title}</td>
							<td class="num" class:muted={!r.opens.total}>{r.opens.total}</td>
							<td class="num good">{r.uniqueStudents}</td>
							<td class="num">{r.opens.student}</td>
							<td class="num">{r.opens.anonymous}</td>
							<td class="num muted">{r.opens.admin}</td>
							<td class="num">{r.lessons.length}</td>
						</tr>

						{#if expanded[r.courseSlug]}
							<tr class="detail">
								<td></td>
								<td colspan="7">
									<table>
										<thead>
											<tr>
												<th>Lesson</th>
												<th class="num">Opens</th>
												<th class="num">Students</th>
												<th class="num">Anonymous</th>
												<th class="num">Admin</th>
											</tr>
										</thead>
										<tbody>
											{#each r.lessons as l (l.slug)}
												<tr>
													<td class="course"><a href={playerHref(l.slug)}>{l.title}</a></td>
													<td class="num">{l.opens.total}</td>
													<td class="num good">{l.uniqueStudents}</td>
													<td class="num">{l.opens.anonymous}</td>
													<td class="num muted">{l.opens.admin}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>

				<tfoot>
					<tr class="total-row">
						<td></td>
						<td>Total · {sorted.length} courses</td>
						<td class="num">{report.totals.opens.total}</td>
						<td class="num good">{report.totals.uniqueStudents}</td>
						<td class="num">{report.totals.opens.student}</td>
						<td class="num">{report.totals.opens.anonymous}</td>
						<td class="num muted">{report.totals.opens.admin}</td>
						<td class="num"></td>
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

	tr.open > td {
		background: rgba(255, 255, 255, 0.03);
	}

	.course {
		font-weight: 600;
	}

	.course a {
		color: var(--theme-accent);
		font-weight: 600;
		text-decoration: none;
	}

	.course a:hover {
		text-decoration: underline;
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

	/* ---------- expanded lessons ---------- */
	.detail > td {
		white-space: normal;
		background: rgba(255, 255, 255, 0.03);
		padding-top: .25rem;
		padding-bottom: .75rem;
	}

	.detail table {
		border: 1px solid var(--theme-border);
		border-radius: 8px;
		border-collapse: separate;
		border-spacing: 0;
		overflow: hidden;
		font-size: .85rem;
	}

	.detail th,
	.detail td {
		padding: .4rem .6rem;
	}

	.detail tbody tr:last-child td {
		border-bottom: none;
	}

	/* ---------- totals ---------- */
	.total-row td {
		font-weight: 700;
		font-size: .95rem;
		border-top: 2px solid var(--theme-border);
		border-bottom: none;
		background: rgba(255, 255, 255, 0.06);
	}

	/* ---------- text colours ---------- */
	.good  { color: #57ab5a; }
	.warn  { color: #d4a72c; }
	.muted { opacity: .55; }
	.err   { color: #e5534b; }

	@media (max-width: 768px) {
		.summary {
			padding: 1rem;
		}
	}
</style>