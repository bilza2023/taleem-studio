
<script>
	// src/routes/admin/super/rating/+page.svelte
	// Deck grades: per-course overview → one deck's star spread, options and comments.
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	const base = config.basePath || "";

	let courses = $state([]);
	let options = $state([]); // [{ key, label }]
	let rows = $state([]); // per-deck summary + title
	let loading = $state(false);
	let error = $state("");
	let sortBy = $state("worst");

	// one deck opened
	let openSlug = $state(null);
	let detail = $state(null);
	let comments = $state([]);
	let detailLoading = $state(false);

	let courseSlug = $derived(page.url.searchParams.get("course") ?? "");

	const optionLabel = (key) => options.find((o) => o.key === key)?.label ?? key;

	let sorted = $derived.by(() => {
		const list = [...rows];
		switch (sortBy) {
			case "best":
				return list.sort((a, b) => b.average - a.average);
			case "count":
				return list.sort((a, b) => b.count - a.count);
			case "name":
				return list.sort((a, b) => a.title.localeCompare(b.title));
			default:
				return list.sort((a, b) => a.average - b.average); // worst first = needs attention
		}
	});

	let totals = $derived.by(() => {
		const count = rows.reduce((n, r) => n + r.count, 0);
		const sum = rows.reduce((n, r) => n + r.average * r.count, 0);
		return { decks: rows.length, count, average: count ? Math.round((sum / count) * 10) / 10 : null };
	});

	function pickCourse(e) {
		const slug = e.currentTarget.value;
		goto(slug ? `?course=${encodeURIComponent(slug)}` : "?", { keepFocus: true });
	}

	async function load(slug) {
		rows = [];
		openSlug = null;
		error = "";
		if (!slug) return;

		loading = true;
		try {
			const [summary, items] = await Promise.all([
				send("rating", "summary", { courseSlug: slug }),
				send("library", "list", { courseSlug: slug })
			]);
			const title = new Map(items.map((i) => [i.slug, i.title]));
			rows = summary.map((r) => ({ ...r, title: title.get(r.librarySlug) ?? r.librarySlug }));
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	async function toggle(slug) {
		if (openSlug === slug) {
			openSlug = null;
			return;
		}
		openSlug = slug;
		detail = null;
		comments = [];
		detailLoading = true;
		try {
			const [d, c] = await Promise.all([
				send("rating", "summary", { courseSlug, librarySlug: slug }),
				send("rating", "list", { courseSlug, librarySlug: slug, withComment: true, pageSize: 50 })
			]);
			detail = d;
			comments = c.items;
		} catch (e) {
			detail = { error: e.message };
		} finally {
			detailLoading = false;
		}
	}

	function stars(n) {
		const full = Math.round(n ?? 0);
		return "★".repeat(full) + "☆".repeat(5 - full);
	}

	function tone(avg) {
		if (avg == null) return "";
		if (avg < 3) return "low";
		if (avg < 4) return "mid";
		return "high";
	}

	onMount(async () => {
		try {
			[courses, options] = await Promise.all([send("course", "list", {}), send("rating", "options", {})]);
		} catch (e) {
			error = e.message;
		}
	});

	$effect(() => {
		load(courseSlug);
	});
</script>

<div class="page">
	<header class="head">
		<h1>Ratings</h1>

		<div class="tools">
			<select value={courseSlug} onchange={pickCourse} aria-label="Course">
				<option value="">— pick a course —</option>
				{#each courses as c (c.slug)}
					<option value={c.slug}>{c.title ?? c.slug}</option>
				{/each}
			</select>

			<select bind:value={sortBy} aria-label="Sort">
				<option value="worst">Lowest rated first</option>
				<option value="best">Highest rated first</option>
				<option value="count">Most ratings</option>
				<option value="name">Name</option>
			</select>
		</div>
	</header>

	{#if !courseSlug}
		<div class="empty">Pick a course to see its ratings.</div>
	{:else if loading}
		<p class="muted">Loading…</p>
	{:else if error}
		<p class="err">{error}</p>
	{:else if !rows.length}
		<div class="empty">No ratings in this course yet.</div>
	{:else}
		<section class="stats">
			<div class="stat">
				<span class="label">Rated decks</span>
				<strong>{totals.decks}</strong>
			</div>
			<div class="stat">
				<span class="label">Ratings</span>
				<strong>{totals.count}</strong>
			</div>
			<div class="stat">
				<span class="label">Average</span>
				<strong class={tone(totals.average)}>{totals.average ?? "–"}</strong>
			</div>
		</section>

		<div class="list">
			{#each sorted as r (r.librarySlug)}
				<article class="deck" class:open={openSlug === r.librarySlug}>
					<button type="button" class="deck-row" onclick={() => toggle(r.librarySlug)}>
						<span class="arrow">{openSlug === r.librarySlug ? "▾" : "▸"}</span>
						<span class="title">{r.title}</span>
						<span class={`stars ${tone(r.average)}`}>{stars(r.average)}</span>
						<span class={`avg ${tone(r.average)}`}>{r.average}</span>
						<span class="count">{r.count} {r.count === 1 ? "rating" : "ratings"}</span>
					</button>

					{#if openSlug === r.librarySlug}
						<div class="detail">
							{#if detailLoading}
								<p class="muted">Loading…</p>
							{:else if detail?.error}
								<p class="err">{detail.error}</p>
							{:else if detail}
								<div class="two">
									<div>
										<h3>Stars</h3>
										{#each [5, 4, 3, 2, 1] as s}
											{@const n = detail.stars[s] ?? 0}
											<div class="bar-row">
												<span class="s">{s}★</span>
												<div class="bar">
													<div class="fill" style:width={`${detail.count ? (n / detail.count) * 100 : 0}%`}></div>
												</div>
												<span class="n">{n}</span>
											</div>
										{/each}
									</div>

									<div>
										<h3>Students said</h3>
										{#if Object.keys(detail.options).length}
											{#each options as o (o.key)}
												{#if detail.options[o.key]}
													<div class="opt">
														<span>{o.label}</span>
														<b>{detail.options[o.key]}</b>
													</div>
												{/if}
											{/each}
										{:else}
											<p class="muted">No options ticked.</p>
										{/if}
									</div>
								</div>

								<h3>Comments ({comments.length})</h3>
								{#if comments.length}
									<ul class="comments">
										{#each comments as c (c.id)}
											<li>
												<div class="c-top">
													<span class={`stars ${tone(c.stars)}`}>{stars(c.stars)}</span>
													<span class="who">{c.user?.name || c.user?.email || "Student"}</span>
													<span class="when">{new Date(c.updatedAt).toLocaleDateString()}</span>
												</div>
												<p>{c.comment}</p>
												{#if c.options?.length}
													<small>{c.options.map(optionLabel).join(" · ")}</small>
												{/if}
											</li>
										{/each}
									</ul>
								{:else}
									<p class="muted">No written comments.</p>
								{/if}

								<a class="open-deck" href={`${base}/admin/edit/content?slug=${encodeURIComponent(r.librarySlug)}`}>
									Open this deck →
								</a>
							{/if}
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.page {
		--gold: #f5b932;
		--line: rgba(255, 255, 255, 0.14);
		max-width: 1000px;
		padding: 1.5rem 2rem 4rem;
		box-sizing: border-box;
		color: var(--theme-text);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.head h1 {
		margin: 0;
		font-size: 1.6rem;
	}

	.tools {
		display: flex;
		gap: 0.5rem;
	}

	.tools select {
		width: auto;
		margin: 0;
		padding: 0.4rem 0.7rem;
		font-size: 0.9rem;
		border-radius: 6px;
	}

	/* ── stats ── */
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	.stat {
		display: grid;
		gap: 0.3rem;
		padding: 0.8rem 1rem;
		border: 1px solid var(--line);
		border-radius: 10px;
	}

	.stat strong {
		font-size: 1.5rem;
	}

	.label {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		opacity: 0.65;
	}

	/* ── deck list ── */
	.list {
		display: grid;
		gap: 0.5rem;
	}

	.deck {
		border: 1px solid var(--line);
		border-radius: 10px;
		overflow: hidden;
	}

	.deck.open {
		border-color: rgba(245, 185, 50, 0.45);
	}

	.deck-row {
		all: unset;
		box-sizing: border-box;
		display: grid;
		grid-template-columns: 1.2rem 1fr auto 2.5rem 6rem;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.7rem 1rem;
		cursor: pointer;
	}

	.deck-row:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.title {
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.stars {
		letter-spacing: 0.1em;
		white-space: nowrap;
	}

	.avg {
		font-weight: 700;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.count {
		font-size: 0.8rem;
		opacity: 0.65;
		text-align: right;
	}

	/* ── detail ── */
	.detail {
		padding: 0.5rem 1rem 1rem;
		border-top: 1px solid var(--line);
		background: rgba(255, 255, 255, 0.02);
	}

	h3 {
		margin: 0.9rem 0 0.5rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.6;
	}

	.two {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.5rem;
	}

	.bar-row {
		display: grid;
		grid-template-columns: 2rem 1fr 2rem;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		margin-bottom: 0.3rem;
	}

	.bar {
		height: 8px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		background: var(--gold);
		border-radius: 999px;
	}

	.n {
		text-align: right;
		opacity: 0.7;
	}

	.opt {
		display: flex;
		justify-content: space-between;
		padding: 0.35rem 0.6rem;
		margin-bottom: 0.3rem;
		border: 1px solid var(--line);
		border-radius: 6px;
		font-size: 0.85rem;
	}

	.comments {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.comments li {
		padding: 0.6rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 8px;
	}

	.c-top {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.8rem;
	}

	.who {
		font-weight: 600;
	}

	.when {
		margin-left: auto;
		opacity: 0.55;
	}

	.comments p {
		margin: 0.4rem 0 0.2rem;
		white-space: pre-wrap;
	}

	.comments small {
		opacity: 0.6;
	}

	.open-deck {
		display: inline-block;
		margin-top: 1rem;
		color: var(--gold);
		font-size: 0.85rem;
		text-decoration: none;
	}

	/* ── colours ── */
	.high { color: #57ab5a; }
	.mid  { color: #d4a72c; }
	.low  { color: #e5534b; }

	.empty {
		padding: 2rem;
		border: 1px dashed var(--line);
		border-radius: 12px;
		text-align: center;
		opacity: 0.7;
	}

	.muted { opacity: 0.6; }
	.err   { color: #e5534b; }
</style>