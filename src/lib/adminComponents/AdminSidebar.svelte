<!-- src/lib/adminComponents/AdminSidebar.svelte -->
<script>
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { config } from "$lib/config.js";

	let { courses = [], isSuper = false, collapsed = $bindable(false) } = $props();

	const base = config.basePath || "";

	// ─── MENU CONFIG ────────────────────────────────────────────
	// scoped: true  → item acts on the selected course (?course= is added)
	// Fix a path here if a page lives somewhere else.
	const TEACHER = [
		{
			title: "This course",
			scoped: true,
			items: [
				{ label: "Decks", path: "/admin/course" },
				{ label: "New deck", path: "/admin/create/content" },
				{ label: "Messages", path: "/admin/communication" }
			]
		},
		{
			title: "Global",
			items: [
				{ label: "Upload image", path: "/admin/create/image" },
				{ label: "Upload SVG", path: "/admin/create/svg" },
				{ label: "Upload audio", path: "/admin/create/audio" },
				{ label: "Docs", path: "/admin/docs" }
			]
		}
	];

	const SUPER = [
		{
			title: "This course",
			scoped: true,
			items: [
				{ label: "New chapter", path: "/admin/super/create/group" },
				{ label: "Sort chapters", path: "/admin/super/create/sort-groups" },
				{ label: "Bulk content", path: "/admin/super/create/bulk-content" },
				{ label: "Bulk group", path: "/admin/super/create/bulk-group" },
				{ label: "Bulk update", path: "/admin/super/create/bulk-update" }
			]
		},
		{
			title: "Global",
			items: [
				{ label: "Courses", path: "/admin/super/course" },
				{ label: "Admins", path: "/admin/super/admin" },
				{ label: "SVG library", path: "/admin/svgs" },
				{ label: "Assets", path: "/admin/assets" },
				{ label: "SVG bulk", path: "/admin/super/edit/svgBulk" },
				{ label: "Summary", path: "/admin/summary" },
				{ label: "Analytics", path: "/admin/analytics" }
			]
		}
	];
	// ────────────────────────────────────────────────────────────

	let course = $derived(page.url.searchParams.get("course") ?? "");
	let path = $derived(page.url.pathname);

	function href(item, scoped) {
		const url = base + item.path;
		return scoped && course ? `${url}?course=${encodeURIComponent(course)}` : url;
	}

	function isActive(item) {
		return path === base + item.path || path.startsWith(base + item.path + "/");
	}

	function switchCourse(e) {
		const slug = e.currentTarget.value;
		goto(slug ? `${base}/admin/course?course=${encodeURIComponent(slug)}` : `${base}/admin`);
	}
</script>

<aside class="sidebar" class:collapsed>
	<div class="head">
		<a class="dash" class:active={path === `${base}/admin`} href={`${base}/admin`}>Dashboard</a>
		<button class="collapse" title="Hide menu" onclick={() => (collapsed = true)}>«</button>
	</div>

	<label class="switcher">
		<span>Working on</span>
		<select value={course} onchange={switchCourse}>
			<option value="">— pick a course —</option>
			{#each courses as c (c.slug)}
				{#if isSuper || c.isActive !== false}
					<option value={c.slug}>{c.title ?? c.slug}</option>
				{/if}
			{/each}
		</select>
	</label>

	{#snippet group(g)}
		<div class="group">
			<div class="g-title">{g.title}</div>
			{#each g.items as item (item.path)}
				{#if g.scoped && !course}
					<span class="item disabled" title="Pick a course first">{item.label}</span>
				{:else}
					<a class="item" class:active={isActive(item)} href={href(item, g.scoped)}>{item.label}</a>
				{/if}
			{/each}
		</div>
	{/snippet}

	{#each TEACHER as g (g.title)}
		{@render group(g)}
	{/each}

	{#if isSuper}
		<details class="super" open>
			<summary>★ Super admin</summary>
			{#each SUPER as g (g.title)}
				{@render group(g)}
			{/each}
		</details>
	{/if}
</aside>

{#if collapsed}
	<button class="reopen" title="Show menu" onclick={() => (collapsed = false)}>☰</button>
{/if}

<style>
	.sidebar {
		--gold: #f5b932;
		position: sticky;
		top: 0;
		align-self: start;
		height: 100vh;
		overflow-y: auto;
		box-sizing: border-box;
		padding: 0.75rem 0.6rem 2rem;
		background: color-mix(in srgb, var(--theme-panel) 70%, black);
		border-right: 1px solid var(--theme-border, rgba(255, 255, 255, 0.1));
		color: var(--theme-text);
		font-size: 0.92rem;
	}

	.sidebar.collapsed {
		display: none;
	}

	.head {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
	}

	.dash {
		flex: 1;
		padding: 0.55rem 0.7rem;
		border-radius: 8px;
		color: var(--theme-text);
		font-weight: 700;
		text-decoration: none;
	}

	.collapse,
	.reopen {
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 8px;
		background: transparent;
		color: var(--theme-text);
		cursor: pointer;
	}

	.collapse {
		width: 30px;
		height: 30px;
		padding: 0;
	}

	.reopen {
		position: fixed;
		left: 0.6rem;
		bottom: 1rem;
		z-index: 50;
		width: 40px;
		height: 40px;
		padding: 0;
		background: color-mix(in srgb, var(--theme-panel) 70%, black);
		font-size: 1.1rem;
	}

	.switcher {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin: 0 0.2rem 1rem;
		padding: 0.6rem;
		border: 1px solid rgba(245, 185, 50, 0.35);
		border-radius: 10px;
		background: rgba(245, 185, 50, 0.06);
	}

	.switcher span {
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--gold);
	}

	.switcher select {
		width: 100%;
		margin: 0;
		padding: 0.4rem;
		font-size: 0.88rem;
	}

	.group {
		margin-bottom: 0.9rem;
	}

	.g-title {
		padding: 0.3rem 0.7rem;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		opacity: 0.55;
	}

	.item {
		display: block;
		padding: 0.45rem 0.7rem;
		border-radius: 8px;
		border-left: 3px solid transparent;
		color: var(--theme-text);
		text-decoration: none;
		transition: background 0.15s ease;
	}

	.item:hover,
	.dash:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.item.active,
	.dash.active {
		background: rgba(245, 185, 50, 0.12);
		border-left-color: var(--gold);
		color: var(--gold);
	}

	.item.disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.super {
		margin-top: 0.5rem;
		padding-top: 0.6rem;
		border-top: 1px dashed rgba(245, 185, 50, 0.4);
	}

	.super summary {
		padding: 0.35rem 0.7rem 0.6rem;
		color: var(--gold);
		font-weight: 700;
		cursor: pointer;
		list-style: none;
	}
</style>