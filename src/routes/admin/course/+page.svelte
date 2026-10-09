<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/course/+page.svelte
	import HomeLinks from "$lib/adminComponents/HomeLinks.svelte";
	import GroupSidebar from "./GroupSidebar.svelte";
	import CourseHero from "$lib/components/CourseHero.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";

	let course = $state(null);
	let groupings = $state([]);
	let items = $state([]);
	let loaded = $state(false);
	let error = $state("");

	let sidebarOpen = $state(true);
	let isMobile = $state(false);
	let showInfo = $state(false);

	// URL is the source of truth for course + group
	let courseSlug = $derived(page.url.searchParams.get("course"));

	// unknown / stale group in URL → fall back to "All"
	let selectedGroup = $derived.by(() => {
		const g = page.url.searchParams.get("group") ?? "";
		return groupings.some(x => x.slug === g) ? g : "";
	});

	let visibleItems = $derived(
		selectedGroup
			? items.filter(item => item.groupSlug === selectedGroup)
			: items
	);

	let counts = $derived.by(() => {
		const c = {};
		for (const item of items) {
			c[item.groupSlug] = (c[item.groupSlug] ?? 0) + 1;
		}
		return c;
	});

	let selectedTitle = $derived(
		selectedGroup
			? (groupings.find(g => g.slug === selectedGroup)?.title ?? selectedGroup)
			: "All lessons"
	);

	async function loadLibrary(slug) {
		try {
			error = "";
			loaded = false;

			const [courseData, groups, list] = await Promise.all([
				send("course", "get", { slug }),
				send("group", "list", { courseSlug: slug }),
				send("adminLibrary", "list", { courseSlug: slug })
			]);

			if (!courseData) {
				error = `Course "${slug}" not found.`;
				return;
			}

			course = courseData;
			groupings = groups;
			items = list.map(item => ({ ...item, image: item.thumbnail }));
			loaded = true;
		} catch (err) {
			error = err.message;
		}
	}

	// reruns only when the course slug changes, not the group
	$effect(() => {
		if (courseSlug) {
			loadLibrary(courseSlug);
		} else {
			error = "No course specified.";
		}
	});

	// desktop: sidebar open, mobile: closed drawer
	$effect(() => {
		const mq = window.matchMedia("(max-width: 768px)");
		const apply = () => {
			isMobile = mq.matches;
			sidebarOpen = !mq.matches;
		};
		apply();
		mq.addEventListener("change", apply);
		return () => mq.removeEventListener("change", apply);
	});

	function selectGroup(slug) {
		const url = new URL(page.url);
		if (slug) url.searchParams.set("group", slug);
		else url.searchParams.delete("group");

		goto(url, { replaceState: true, keepFocus: true });

		if (isMobile) sidebarOpen = false;
	}

	function onKeydown(e) {
		if (e.key !== "Escape") return;
		showInfo = false;
		if (isMobile) sidebarOpen = false;
	}
</script>
<svelte:window onkeydown={onKeydown} />

{#if error}
	<p class="message">{error}</p>
{:else if !loaded}
	<p class="message">Loading...</p>
{:else}
	<div class="course-page">
		<header class="topbar">
			<button
				class="bar-btn"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				aria-label="Toggle exercises"
				aria-expanded={sidebarOpen}
			>☰</button>

			<h1 class="course-title">{course.title ?? courseSlug}</h1>

			<button class="bar-btn" onclick={() => (showInfo = true)}>
				Course info
			</button>
		</header>

		<div class="layout">
			{#if sidebarOpen}
				{#if isMobile}
					<div
						class="backdrop"
						role="presentation"
						onclick={() => (sidebarOpen = false)}
					></div>
				{/if}

				<aside class="sidebar" class:drawer={isMobile}>
					<GroupSidebar
						groups={groupings}
						{counts}
						total={items.length}
						value={selectedGroup}
						onSelect={selectGroup}
					/>
				</aside>
			{/if}

			<div class="body">
				<h2 class="group-heading">
					{selectedTitle}
					<span>· {visibleItems.length} lessons</span>
				</h2>

				<HomeLinks homeLinks={visibleItems} />
			</div>
		</div>
	</div>

	{#if showInfo}
		<div
			class="overlay"
			role="presentation"
			onclick={(e) => { if (e.target === e.currentTarget) showInfo = false; }}
		>
			<div class="info-panel" role="dialog" aria-modal="true">
				<button
					class="close"
					onclick={() => (showInfo = false)}
					aria-label="Close"
				>✕</button>

				<CourseHero {course} lessonCount={items.length} />
			</div>
		</div>
	{/if}

	<br />
	<Footer />
{/if}

<style>
	.course-page {
		--topbar-h: 52px;
		min-height: 100vh;
		background: var(--theme-panel);
		color: var(--theme-text);
	}

	.message {
		padding: 2rem;
	}

	/* ---------- top bar ---------- */
	.topbar {
		position: sticky;
		top: 0;
		z-index: 20;
		height: var(--topbar-h);
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: .75rem;
		padding: 0 1rem;
		background: var(--theme-panel);
		border-bottom: 1px solid var(--theme-border);
	}

	.course-title {
		flex: 1;
		margin: 0;
		font-size: 1.1rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.bar-btn {
		width: auto;
		margin: 0;
		padding: .35rem .8rem;
		font-size: .9rem;
	}

	/* ---------- layout ---------- */
	.layout {
		display: flex;
		align-items: flex-start;
	}

	.sidebar {
		width: 260px;
		flex-shrink: 0;
		position: sticky;
		top: var(--topbar-h);
		height: calc(100vh - var(--topbar-h));
		overflow-y: auto;
		border-right: 1px solid var(--theme-border);
		background: var(--theme-panel);
	}

	/* mobile: slide-over drawer */
	.sidebar.drawer {
		position: fixed;
		top: 0;
		left: 0;
		height: 100vh;
		width: min(80vw, 300px);
		z-index: 40;
		box-shadow: 4px 0 16px rgba(0, 0, 0, 0.4);
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 30;
		background: rgba(0, 0, 0, 0.5);
	}

	.body {
		flex: 1;
		min-width: 0;
		padding: 1rem;
	}

	.group-heading {
		margin: 0;
		font-size: 1.25rem;
	}

	.group-heading span {
		font-size: .9rem;
		font-weight: 400;
		opacity: .65;
	}

	/* ---------- course info panel ---------- */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 4rem 1rem;
		overflow-y: auto;
		background: rgba(0, 0, 0, 0.6);
	}

	.info-panel {
		position: relative;
		width: min(100%, 900px);
		box-sizing: border-box;
		padding: 1rem;
		background: var(--theme-panel);
		border: 1px solid var(--theme-border);
		border-radius: 12px;
	}

	.close {
		position: absolute;
		top: .5rem;
		right: .5rem;
		z-index: 1;
		width: auto;
		margin: 0;
		padding: .25rem .6rem;
	}
</style>