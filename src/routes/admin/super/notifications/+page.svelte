<script>
	// src/routes/admin/super/notifications/+page.svelte
	// Super admin: post announcements to everyone, one course, or one student.
	import { onMount } from "svelte";
	import { send } from "$lib/send";

	const AUDIENCES = [
		{ value: "APP", label: "Everyone" },
		{ value: "COURSE", label: "One course" },
		{ value: "USER", label: "One student" }
	];
	const PAGE_SIZE = 20;

	// ── list ──
	let items = $state([]);
	let total = $state(0);
	let page = $state(1);
	let pages = $state(1);
	let filter = $state("");
	let loading = $state(true);
	let error = $state("");

	// ── form ──
	let courses = $state([]);
	let audience = $state("APP");
	let courseSlug = $state("");
	let userId = $state("");
	let title = $state("");
	let body = $state("");
	let link = $state("");
	let publishAt = $state("");
	let expiresAt = $state("");
	let saving = $state(false);
	let formMsg = $state("");
	let formOk = $state(false);

	const courseTitle = (slug) => courses.find((c) => c.slug === slug)?.title ?? slug;

	function status(n) {
		const now = Date.now();
		if (new Date(n.publishAt).getTime() > now) return "scheduled";
		if (n.expiresAt && new Date(n.expiresAt).getTime() <= now) return "expired";
		return "live";
	}

	function when(d) {
		return d ? new Date(d).toLocaleString() : "—";
	}

	function target(n) {
		if (n.audience === "APP") return "Everyone";
		if (n.audience === "COURSE") return `Course: ${courseTitle(n.courseSlug)}`;
		return `Student #${n.userId}`;
	}

	async function load() {
		loading = true;
		error = "";
		try {
			const data = await send("notification", "list", {
				audience: filter || undefined,
				page,
				pageSize: PAGE_SIZE
			});
			items = data.items;
			total = data.total;
			pages = data.pages;
		} catch (e) {
			error = e.message;
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		try {
			courses = (await send("course", "list", {})) ?? [];
		} catch {}
		load();
	});

	function setFilter(value) {
		filter = value;
		page = 1;
		load();
	}

	function goTo(n) {
		page = Math.min(Math.max(1, n), pages);
		load();
	}

	function resetForm() {
		audience = "APP";
		courseSlug = "";
		userId = "";
		title = "";
		body = "";
		link = "";
		publishAt = "";
		expiresAt = "";
	}

	async function create(e) {
		e.preventDefault();
		formMsg = "";

		if (!title.trim()) {
			formOk = false;
			formMsg = "Title is required.";
			return;
		}

		const data = { audience, title: title.trim() };
		if (body.trim()) data.body = body.trim();
		if (link.trim()) data.link = link.trim();
		if (audience === "COURSE") data.courseSlug = courseSlug;
		if (audience === "USER") data.userId = Number(userId);
		if (publishAt) data.publishAt = new Date(publishAt).toISOString();
		if (expiresAt) data.expiresAt = new Date(expiresAt).toISOString();

		saving = true;
		try {
			await send("notification", "create", data);
			formOk = true;
			formMsg = "Posted ✓";
			resetForm();
			page = 1;
			await load();
		} catch (err) {
			formOk = false;
			formMsg = err.message;
		} finally {
			saving = false;
		}
	}

	async function remove(n) {
		if (!confirm(`Delete "${n.title}"?`)) return;
		try {
			await send("notification", "delete", { id: n.id });
			await load();
		} catch (err) {
			alert(err.message);
		}
	}
</script>

<div class="page">
	<header class="head">
		<h1>Notifications</h1>
		<span class="muted">{total} total</span>
	</header>

	<!-- ── new notification ── -->
	<form class="box" onsubmit={create}>
		<h2>New notification</h2>

		<div class="row">
			<label>
				<span>Send to</span>
				<select bind:value={audience}>
					{#each AUDIENCES as a}
						<option value={a.value}>{a.label}</option>
					{/each}
				</select>
			</label>

			{#if audience === "COURSE"}
				<label>
					<span>Course</span>
					<select bind:value={courseSlug} required>
						<option value="">— pick a course —</option>
						{#each courses as c (c.slug)}
							<option value={c.slug}>{c.title ?? c.slug}</option>
						{/each}
					</select>
				</label>
			{:else if audience === "USER"}
				<label>
					<span>Student ID</span>
					<input type="number" min="1" bind:value={userId} required />
				</label>
			{/if}
		</div>

		<label>
			<span>Title</span>
			<input type="text" bind:value={title} maxlength="120" placeholder="e.g. New chapter added" />
		</label>

		<label>
			<span>Message <small>(optional)</small></span>
			<textarea rows="3" bind:value={body}></textarea>
		</label>

		<label>
			<span>Link <small>(optional — e.g. /course?course=fbise9math)</small></span>
			<input type="text" bind:value={link} />
		</label>

		<div class="row">
			<label>
				<span>Show from <small>(empty = now)</small></span>
				<input type="datetime-local" bind:value={publishAt} />
			</label>
			<label>
				<span>Hide after <small>(empty = never)</small></span>
				<input type="datetime-local" bind:value={expiresAt} />
			</label>
		</div>

		<div class="form-foot">
			<button type="submit" class="btn gold" disabled={saving}>
				{saving ? "Posting…" : "Post notification"}
			</button>
			{#if formMsg}
				<span class={formOk ? "ok" : "err"}>{formMsg}</span>
			{/if}
		</div>
	</form>

	<!-- ── list ── -->
	<div class="list-head">
		<h2>Posted</h2>
		<div class="filters">
			<button type="button" class="chip" class:on={filter === ""} onclick={() => setFilter("")}>All</button>
			{#each AUDIENCES as a}
				<button type="button" class="chip" class:on={filter === a.value} onclick={() => setFilter(a.value)}>
					{a.label}
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if error}
		<p class="err">{error}</p>
	{:else if !items.length}
		<div class="empty">No notifications yet.</div>
	{:else}
		<div class="cards">
			{#each items as n (n.id)}
				{@const st = status(n)}
				<article class="card {st}">
					<div class="card-top">
						<strong>{n.title}</strong>
						<span class={`badge ${st}`}>{st}</span>
					</div>

					{#if n.body}<p class="body">{n.body}</p>{/if}
					{#if n.link}<a class="link" href={n.link} target="_blank" rel="noopener">{n.link}</a>{/if}

					<div class="meta">
						<span>{target(n)}</span>
						<span>From {when(n.publishAt)}</span>
						<span>Until {when(n.expiresAt)}</span>
						{#if n.createdBy}<span>By {n.createdBy}</span>{/if}
					</div>

					<button type="button" class="btn danger" onclick={() => remove(n)}>Delete</button>
				</article>
			{/each}
		</div>

		{#if pages > 1}
			<div class="pager">
				<button type="button" class="btn" onclick={() => goTo(page - 1)} disabled={page <= 1}>← Prev</button>
				<span>Page {page} of {pages}</span>
				<button type="button" class="btn" onclick={() => goTo(page + 1)} disabled={page >= pages}>Next →</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.page {
		--gold: #f5b932;
		--line: rgba(255, 255, 255, 0.14);
		max-width: 900px;
		padding: 1.5rem 2rem 4rem;
		box-sizing: border-box;
		color: var(--theme-text);
	}

	.head {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}

	.head h1 {
		margin: 0;
		font-size: 1.6rem;
	}

	h2 {
		margin: 0 0 0.85rem;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.6;
	}

	/* ── form ── */
	.box {
		display: grid;
		gap: 0.85rem;
		padding: 1.2rem;
		margin-bottom: 2rem;
		border: 1px solid rgba(245, 185, 50, 0.35);
		border-radius: 12px;
		background: rgba(245, 185, 50, 0.04);
	}

	.row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.85rem;
	}

	label {
		display: grid;
		gap: 0.3rem;
		font-size: 0.85rem;
	}

	label > span {
		font-weight: 600;
		opacity: 0.85;
	}

	label small {
		font-weight: 400;
		opacity: 0.6;
	}

	input,
	select,
	textarea {
		width: 100%;
		box-sizing: border-box;
		margin: 0;
		padding: 0.5rem 0.6rem;
		font: inherit;
		border-radius: 6px;
	}

	textarea {
		resize: vertical;
	}

	.form-foot {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	/* ── buttons ── */
	.btn {
		width: auto;
		margin: 0;
		padding: 0.45rem 0.9rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		background: transparent;
		color: var(--theme-text);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.btn.gold {
		border-color: var(--gold);
		background: var(--gold);
		color: #1a1300;
	}

	.btn.danger:hover {
		border-color: #e5534b;
		color: #e5534b;
	}

	/* ── list ── */
	.list-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 0.85rem;
	}

	.list-head h2 {
		margin: 0;
	}

	.filters {
		display: flex;
		gap: 0.4rem;
	}

	.chip {
		width: auto;
		margin: 0;
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: transparent;
		color: var(--theme-text);
		font-size: 0.8rem;
		cursor: pointer;
	}

	.chip.on {
		border-color: var(--gold);
		color: var(--gold);
		background: rgba(245, 185, 50, 0.1);
	}

	.cards {
		display: grid;
		gap: 0.75rem;
	}

	.card {
		display: grid;
		gap: 0.45rem;
		padding: 0.9rem 1rem;
		border: 1px solid var(--line);
		border-left: 4px solid #57ab5a;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.02);
	}

	.card.scheduled { border-left-color: #4f8cff; }
	.card.expired   { border-left-color: #666; opacity: 0.6; }

	.card .btn {
		justify-self: start;
	}

	.card-top {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.badge {
		padding: 0.1rem 0.55rem;
		border-radius: 999px;
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		height: fit-content;
	}

	.badge.live      { background: #2f4e36; }
	.badge.scheduled { background: #2c4590; }
	.badge.expired   { background: #444; }

	.body {
		margin: 0;
		opacity: 0.85;
		white-space: pre-wrap;
	}

	.link {
		font-size: 0.82rem;
		color: var(--gold);
		overflow-wrap: anywhere;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem 1rem;
		font-size: 0.78rem;
		opacity: 0.6;
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 1.25rem;
	}

	.empty {
		padding: 2rem;
		border: 1px dashed var(--line);
		border-radius: 12px;
		text-align: center;
		opacity: 0.7;
	}

	.muted { opacity: 0.6; }
	.ok    { color: #57ab5a; }
	.err   { color: #e5534b; }
</style>