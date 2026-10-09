


<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/manage-courses/+page.svelte
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	let courses = $state([]);
	let loading = $state(true);
	let error = $state("");

	const VIEW = [
		{ label: "Open", path: "/admin/course" },
		{ label: "Lessons", path: "/admin/lessons" }
	];

	const CONTENT = [
		{ label: "New", path: "/admin/create/content" },
		{ label: "Bulk Create", path: "/admin/create/bulk-content" },
		{ label: "Bulk Update", path: "/admin/create/bulk-update" }
	];

	const GROUPS = [
		{ label: "Add Group", path: "/admin/create/group" },
		{ label: "Bulk Groups", path: "/admin/create/bulk-group" },
		{ label: "Edit Groups", path: "/admin/groups" }
	];

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
				<section class="row">
					<div class="info">
						<div class="title">
							<strong>{c.title ?? c.slug}</strong>
							{#if c.access}
								<span class={`badge ${c.access.toLowerCase()}`}>{c.access}</span>
							{/if}
						</div>
						<code>{c.slug}</code>
					</div>

					<div class="actions">
						<div class="set">
							{#each VIEW as a}
								<a class="btn view" href={href(a.path, c.slug)}>{a.label}</a>
							{/each}
						</div>

						<div class="set">
							{#each CONTENT as a}
								<a class="btn" href={href(a.path, c.slug)}>{a.label}</a>
							{/each}
						</div>

						<div class="set">
							{#each GROUPS as a}
								<a class="btn group" href={href(a.path, c.slug)}>{a.label}</a>
							{/each}
						</div>
					</div>
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
		flex-direction: column;
		gap: .65rem;
		padding: .9rem 1rem;
		border: 1px solid var(--theme-border);
		border-radius: 10px;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: .2rem;
	}

	.title {
		display: flex;
		align-items: center;
		gap: .6rem;
		font-size: 1.05rem;
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

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: .5rem 1.25rem;
	}

	.set {
		display: flex;
		flex-wrap: wrap;
		gap: .4rem;
	}

	.btn {
		display: inline-block;
		padding: .4rem .75rem;
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

	.btn.view {
		color: #cfe6ff;
		background: #1d3550;
		border-color: #3d6fa3;
	}

	.btn.view:hover {
		background: #24456a;
	}

	.btn.group {
		color: #e2d6ff;
		background: #2e2550;
		border-color: #6750a3;
	}

	.btn.group:hover {
		background: #3a2f66;
	}

	.muted { opacity: .6; }
	.err   { color: #e5534b; }
</style>