<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/manage-courses/+page.svelte
	// Structure work (groups, bulk create/update) lives in taleem-cli.
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	let courses = $state([]);
	let loading = $state(true);
	let error = $state("");

	function href(path, slug) {
		return `${config.basePath}${path}?course=${encodeURIComponent(slug)}`;
	}

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

<div class="manage">
	<h1>Manage courses</h1>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if error}
		<p class="err">{error}</p>
	{:else if !courses.length}
		<p class="muted">No courses yet.</p>
	{:else}
		<div class="list">
			{#each courses as c (c.slug)}
				<section class="row" class:inactive={c.isActive === false}>
					<div class="info">
						<div class="title">
							<a class="course-link" href={href("/admin/course", c.slug)}>
								{c.title ?? c.slug}
							</a>
							{#if c.access}
								<span class={`badge ${c.access.toLowerCase()}`}>{c.access}</span>
							{/if}
							{#if c.isActive === false}
								<span class="badge off">INACTIVE</span>
							{/if}
						</div>
						<code>{c.slug}</code>
					</div>

					<a class="btn" href={href("/admin/create/content", c.slug)}>+ New</a>
				</section>
			{/each}
		</div>
	{/if}
</div>

<style>
	.manage {
		min-height: 100vh;
		padding: 1rem 1.5rem 3rem;
		box-sizing: border-box;
		background: var(--theme-panel);
		color: var(--theme-text);
	}

	h1 {
		margin: 0 0 1rem;
		font-size: 1.5rem;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: .75rem;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: .9rem 1rem;
		border: 1px solid var(--theme-border);
		border-radius: 10px;
	}

	.row.inactive {
		opacity: .55;
		border-style: dashed;
	}

	.row.inactive:hover {
		opacity: 1;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: .2rem;
		min-width: 0;
	}

	.title {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: .6rem;
		font-size: 1.05rem;
	}

	.course-link {
		font-weight: 700;
		color: var(--theme-text);
		text-decoration: none;
	}

	.course-link:hover {
		color: #5fa8ff;
		text-decoration: underline;
	}

	code {
		width: fit-content;
		font-size: .8rem;
		opacity: .7;
	}

	.badge {
		padding: .1rem .5rem;
		border-radius: 999px;
		font-size: .65rem;
		font-weight: 700;
		letter-spacing: .05em;
		background: rgba(255, 255, 255, 0.1);
	}

	.badge.open         { background: #2f4e36; }
	.badge.members      { background: #3d4452; }
	.badge.subscription { background: #5a4e2f; }
	.badge.off          { background: #5a2f2f; }

	.btn {
		flex-shrink: 0;
		display: inline-block;
		padding: .4rem .9rem;
		font-size: .85rem;
		color: #d9f99d;
		background: #3f3a16;
		border: 1px solid #a3a322;
		border-radius: 6px;
		text-decoration: none;
	}

	.btn:hover {
		background: #514d18;
		border-color: #c4c43a;
	}

	.muted { opacity: .6; }
	.err   { color: #e5534b; }
</style>