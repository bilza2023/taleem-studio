<script>
	import { page } from "$app/state";
	import { send } from "$lib/send";

	const courseSlug = page.url.searchParams.get("course");
	const STATUSES = [
		{ key: "OPEN", label: "Open" },
		{ key: "ANSWERED", label: "Answered" },
		{ key: "CLOSED", label: "Closed" },
		{ key: "", label: "All" }
	];
	const PAGE_SIZE = 20;

	let status = $state("OPEN");
	let pageNo = $state(1);
	let data = $state({ items: [], total: 0, pages: 1 });
	let loading = $state(true);
	let error = $state("");
	let drafts = $state({});      // id → reply text
	let savingId = $state(null);

	// accept either a plain array or { items, total, pages }
	function normalize(res) {
		if (Array.isArray(res)) {
			return { items: res, total: res.length, pages: 1 };
		}
		const items = res?.items ?? [];
		const total = res?.total ?? items.length;
		const pages = res?.pages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
		return { items, total, pages };
	}

	async function load() {
		loading = true;
		error = "";
		try {
			const res = await send("inquiry", "list", {
				courseSlug: courseSlug || undefined,
				status: status || undefined,
				page: pageNo,
				pageSize: PAGE_SIZE
			});
			data = normalize(res);
			drafts = Object.fromEntries(data.items.map((i) => [i.id, i.reply ?? ""]));
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		status; pageNo; // rerun when these change
		load();
	});

	function setStatusFilter(s) {
		status = s;
		pageNo = 1;
	}

	async function reply(item) {
		const text = (drafts[item.id] ?? "").trim();
		if (!text) return alert("Write a reply first.");
		savingId = item.id;
		try {
		const updated = await send("inquiry", "reply", { id: item.id, reply: text });
			data.items = data.items.map((i) => (i.id === item.id ? { ...i, ...updated } : i));
		} catch (err) {
			alert(err.message);
		} finally {
			savingId = null;
		}
	}

	async function setItemStatus(item, newStatus) {
		savingId = item.id;
		try {
			const updated = await send("inquiry", "setStatus", { id: item.id, status: newStatus });
			data.items = data.items.map((i) => (i.id === item.id ? { ...i, ...updated } : i));
		} catch (err) {
			alert(err.message);
		} finally {
			savingId = null;
		}
	}

	const when = (d) => (d ? new Date(d).toLocaleString() : "");
</script>

<main class="feed">
	<h1>✉ Student messages</h1>
	<p class="subtitle">
		{#if courseSlug}Messages for <strong>{courseSlug}</strong>{:else}All messages (super admin){/if}
		· {data.total} total
	</p>

	<div class="tabs">
		{#each STATUSES as s}
			<button class="tab" class:active={status === s.key} onclick={() => setStatusFilter(s.key)}>
				{s.label}
			</button>
		{/each}
	</div>

	{#if loading}
		<p>Loading…</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if data.items.length === 0}
		<article class="card">No messages here.</article>
	{:else}
		{#each data.items as item (item.id)}
			<article class="card">
				<div class="header">
					<div>
						<div class="user">👤 {item.user?.email ?? item.userId}</div>
						{#if item.courseSlug}<div class="course">📘 {item.courseSlug}</div>{/if}
					</div>
					<div class="right">
						<span class="badge {item.status.toLowerCase()}">{item.status}</span>
						<div class="time">{when(item.createdAt)}</div>
					</div>
				</div>

				<div class="message">{item.message}</div>

				{#if item.status === "ANSWERED" && item.repliedAt}
					<p class="meta">Replied by {item.repliedBy} · {when(item.repliedAt)}
						{#if item.replyReadAt}· seen by student{/if}</p>
				{/if}

				<label class="reply-label">
					Reply
					<textarea class="reply-input" bind:value={drafts[item.id]}></textarea>
				</label>

				<div class="actions">
					{#if item.status !== "CLOSED"}
						<button class="ghost" disabled={savingId === item.id} onclick={() => setItemStatus(item, "CLOSED")}>
							Close
						</button>
					{:else}
						<button class="ghost" disabled={savingId === item.id} onclick={() => setItemStatus(item, "OPEN")}>
							Reopen
						</button>
					{/if}
					<button disabled={savingId === item.id} onclick={() => reply(item)}>
						{savingId === item.id ? "Saving…" : item.reply ? "Update reply" : "Send reply"}
					</button>
				</div>
			</article>
		{/each}

		{#if data.pages > 1}
			<div class="pager">
				<button class="ghost" disabled={pageNo <= 1} onclick={() => pageNo--}>← Prev</button>
				<span>Page {pageNo} of {data.pages}</span>
				<button class="ghost" disabled={pageNo >= data.pages} onclick={() => pageNo++}>Next →</button>
			</div>
		{/if}
	{/if}
</main>

<style>
	.feed { width: min(95vw, 900px); margin: 0 auto; padding: 2rem 1rem; box-sizing: border-box; color: var(--theme-text); }
	h1 { margin-top: 0; }
	.subtitle { margin-bottom: 1rem; opacity: .7; }
	.error { color: #f87171; }

	.tabs { display: flex; gap: .4rem; margin-bottom: 1.25rem; }
	.tab { all: unset; cursor: pointer; padding: .35rem .9rem; border-radius: 999px; border: 1px solid var(--theme-border); font-size: .85rem; }
	.tab.active { background: var(--theme-accent); color: #fff; border-color: var(--theme-accent); }

	.card { margin-bottom: 1rem; padding: 1rem; border: 1px solid var(--theme-border); border-radius: 14px; background: var(--theme-panel); }
	.header { display: flex; justify-content: space-between; gap: 1rem; margin-bottom: .75rem; }
	.user { font-weight: 600; }
	.course { font-size: .85rem; opacity: .75; margin-top: .2rem; }
	.right { text-align: right; }
	.time { font-size: .8rem; opacity: .65; margin-top: .3rem; white-space: nowrap; }
	.badge { font-size: .7rem; font-weight: 700; padding: .15rem .55rem; border-radius: 999px; letter-spacing: .04em; }
	.badge.open { background: #3a2c0a; color: #fcd34d; }
	.badge.answered { background: #064e3b; color: #6ee7b7; }
	.badge.closed { background: #334155; color: #cbd5e1; }

	.message { line-height: 1.7; margin-bottom: .75rem; white-space: pre-wrap; }
	.meta { font-size: .8rem; opacity: .7; margin: 0 0 .75rem; }

	.reply-label { display: grid; gap: .4rem; font-weight: 600; font-size: .85rem; margin-bottom: .75rem; }
	.reply-input { box-sizing: border-box; width: 100%; min-height: 80px; padding: .6rem .75rem; border: 1px solid var(--theme-border); border-radius: 8px; background: var(--theme-panel); color: var(--theme-text); font: inherit; resize: vertical; }

	.actions { display: flex; justify-content: flex-end; gap: .5rem; }
	button { width: auto; margin: 0; padding: .5rem 1rem; border: 0; border-radius: 6px; background: var(--theme-accent); color: #fff; font: inherit; cursor: pointer; }
	button.ghost { background: transparent; border: 1px solid var(--theme-border); color: var(--theme-text); }
	button:disabled { opacity: .5; cursor: default; }

	.pager { display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1rem; }
</style>