<script>
	// src/routes/admin/+page.svelte — admin dashboard
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	const base = config.basePath || "";

	let courses = $state([]);
	let loading = $state(true);
	let error = $state("");

	const href = (path, slug) => `${base}${path}?course=${encodeURIComponent(slug)}`;

	const quick = [
		{ label: "Upload image", path: "/admin/create/image", icon: "🖼" },
		{ label: "Upload SVG", path: "/admin/create/svg", icon: "✏️" },
		{ label: "Upload audio", path: "/admin/create/audio", icon: "🎙" },
		{ label: "Docs", path: "/admin/docs", icon: "📖" }
	];

	onMount(async () => {
		try {
			courses = (await send("course", "list", {})) ?? [];
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	});
</script>

<div class="dash">
	<header class="hero">
		<h1>Assalam o Alaikum 👋</h1>
		<p>Pick a course to start working, or use a quick link below.</p>
	</header>

	<section>
		<h2>Your courses</h2>

		{#if loading}
			<p class="muted">Loading…</p>
		{:else if error}
			<p class="err">{error}</p>
		{:else if !courses.length}
			<div class="empty">No courses yet.</div>
		{:else}
			<div class="grid">
				{#each courses as c (c.slug)}
					<article class="card" class:inactive={c.isActive === false}>
						<div class="top">
							<a class="title" href={href("/admin/course", c.slug)}>{c.title ?? c.slug}</a>
							<div class="badges">
								{#if c.access}<span class={`badge ${c.access.toLowerCase()}`}>{c.access}</span>{/if}
								{#if c.isActive === false}<span class="badge off">Inactive</span>{/if}
							</div>
						</div>
						<code>{c.slug}</code>

						<div class="actions">
							<a class="btn ghost" href={href("/admin/course", c.slug)}>Open</a>
							<a class="btn gold" href={href("/admin/create/content", c.slug)}>+ New deck</a>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>

	<section>
		<h2>Quick links</h2>
		<div class="quick">
			{#each quick as q (q.path)}
				<a class="q" href={base + q.path}>
					<span class="q-icon">{q.icon}</span>
					{q.label}
				</a>
			{/each}
		</div>
	</section>

	<section class="loop">
		<h2>Making a lesson</h2>
		<ol>
			<li><b>New deck</b> in the right chapter</li>
			<li><b>Editor</b> — build the slides</li>
			<li><b>Narration</b> — write what you will say</li>
			<li><b>Timings</b> — record audio and sync it</li>
			<li><b>Publish</b> — students can see it</li>
		</ol>
	</section>
</div>

<style>
	.dash {
		--gold: #f5b932;
		max-width: 1100px;
		padding: 1.5rem 2rem 4rem;
		box-sizing: border-box;
		color: var(--theme-text);
	}

	.hero {
		margin-bottom: 2rem;
	}

	.hero h1 {
		margin: 0 0 0.3rem;
		font-size: 1.8rem;
	}

	.hero p {
		margin: 0;
		opacity: 0.7;
	}

	section {
		margin-bottom: 2.25rem;
	}

	h2 {
		margin: 0 0 0.85rem;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		opacity: 0.6;
	}

	/* ---------- course cards ---------- */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		padding: 1.1rem 1.2rem;
		border: 1px solid rgba(245, 185, 50, 0.25);
		border-radius: 14px;
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
		transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
	}

	.card:hover {
		transform: translateY(-2px);
		border-color: var(--gold);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 18px rgba(245, 185, 50, 0.12);
	}

	.card.inactive {
		opacity: 0.5;
		border-style: dashed;
	}

	.top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.title {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--theme-text);
		text-decoration: none;
	}

	.title:hover {
		color: var(--gold);
	}

	.badges {
		display: flex;
		gap: 0.3rem;
		flex-shrink: 0;
	}

	.badge {
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		font-size: 0.62rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		background: rgba(255, 255, 255, 0.1);
	}

	.badge.open         { background: #2f4e36; }
	.badge.members      { background: #3d4452; }
	.badge.subscription { background: #5a4e2f; }
	.badge.off          { background: #5a2f2f; }

	code {
		width: fit-content;
		font-size: 0.78rem;
		opacity: 0.55;
	}

	.actions {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 0.5rem;
		margin-top: 0.8rem;
	}

	.btn {
		display: flex;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 8px;
		font-size: 0.88rem;
		font-weight: 700;
		text-decoration: none;
		transition: background 0.2s ease, box-shadow 0.2s ease;
	}

	.btn.ghost {
		border: 1px solid rgba(255, 255, 255, 0.22);
		color: var(--theme-text);
	}

	.btn.ghost:hover {
		background: rgba(255, 255, 255, 0.07);
	}

	.btn.gold {
		background: var(--gold);
		color: #1a1300;
	}

	.btn.gold:hover {
		box-shadow: 0 4px 16px rgba(245, 185, 50, 0.4);
	}

	/* ---------- quick links ---------- */
	.quick {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
	}

	.q {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.7rem 1.1rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.03);
		color: var(--theme-text);
		font-weight: 600;
		text-decoration: none;
		transition: border-color 0.2s ease, background 0.2s ease;
	}

	.q:hover {
		border-color: var(--gold);
		background: rgba(245, 185, 50, 0.06);
	}

	.q-icon {
		font-size: 1.15rem;
	}

	/* ---------- lesson loop ---------- */
	.loop ol {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.loop li {
		counter-increment: step;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 0.95rem;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.04);
		font-size: 0.88rem;
	}

	.loop li::before {
		content: counter(step);
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--gold);
		color: #1a1300;
		font-size: 0.75rem;
		font-weight: 800;
	}

	.loop b {
		color: var(--gold);
	}

	.muted { opacity: 0.6; }
	.err   { color: #e5534b; }

	.empty {
		padding: 2rem;
		border: 1px dashed rgba(255, 255, 255, 0.15);
		border-radius: 12px;
		text-align: center;
		opacity: 0.7;
	}
</style>