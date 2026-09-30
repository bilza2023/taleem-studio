<script>
///home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/lessons/+page.svelte
import HomeLinks from "$lib/adminComponents/HomeLinks.svelte";
import CourseHero from "$lib/components/CourseHero.svelte";
import Footer from "$lib/components/Footer.svelte";
import { page } from "$app/state";
import { goto } from "$app/navigation";
import { send } from "$lib/send";
import GroupingNav from "$lib/components/GroupingNav.svelte";
import { config } from "$lib/config.js";

let home = $state(null);
let course = $state(null);
let groupings = $state([]);
let error = $state("");
let search = $state("");

const STATUSES = [
	{ value: "", label: "All" },
	{ value: "DRAFT", label: "📝 Draft" },
	{ value: "PUBLISHED", label: "✅ Published" },
	{ value: "ARCHIVED", label: "🗄️ Archived" }
];

// URL is the source of truth
let courseSlug = $derived(page.url.searchParams.get("course"));
let statusFilter = $derived(page.url.searchParams.get("status") ?? "");

let selectedGrouping = $derived.by(() => {
	const g = page.url.searchParams.get("group") ?? "";
	// unknown / stale group in URL → fall back to "All"
	return groupings.some(x => x.slug === g) ? g : "";
});

// step 1: group
let groupItems = $derived(
	!selectedGrouping
		? home?.items ?? []
		: (home?.items ?? []).filter(
			item => item.groupSlug === selectedGrouping
		)
);

// counts per status (within the selected group)
let statusCounts = $derived.by(() => {
	const c = {};
	for (const item of groupItems) c[item.status] = (c[item.status] ?? 0) + 1;
	return c;
});

// step 2 + 3: status, then search
let visibleItems = $derived.by(() => {
	let list = groupItems;

	if (statusFilter) {
		list = list.filter(item => item.status === statusFilter);
	}

	const words = search.toLowerCase().trim().split(/\s+/).filter(Boolean);

	if (words.length) {
		list = list.filter(item => {
			const hay = `${item.title ?? ""} ${item.slug}`.toLowerCase();
			return words.every(w => hay.includes(w));
		});
	}

	return list;
});

function setParam(name, value) {
	const url = new URL(page.url);

	if (value) url.searchParams.set(name, value);
	else url.searchParams.delete(name);

	goto(url, { replaceState: true, noScroll: true, keepFocus: true });
}

function handleGroupingChange(id) {
	setParam("group", id);
}

async function loadLibrary(courseSlug) {
	try {
		error = "";

		const [courseData, groups, items] = await Promise.all([
			send("course", "get", { slug: courseSlug }),
			send("group", "list", { courseSlug }),
			send("adminLibrary", "list", { courseSlug })
		]);

		if (!courseData) {
			error = `Course "${courseSlug}" not found.`;
			return;
		}

		course = courseData;
		groupings = groups;

		home = {
			items: items.map(item => ({
				...item,
				image: item.thumbnail
			}))
		};

	} catch (err) {
		error = err.message;
	}
}

$effect(() => {
	if (courseSlug) {
		loadLibrary(courseSlug);
	}
});
</script>

{#if error}

	<p>{error}</p>

{:else if !home}

	<p>Loading...</p>

{:else}

	<div class="container">
<CourseHero
	course={course}
	lessonCount={home.items.length}
/>

<GroupingNav
	groupings={groupings}
	value={selectedGrouping}
	onChange={handleGroupingChange}
/>

<div class="filter-bar">
	<input
		type="search"
		placeholder="Search title or slug…"
		bind:value={search}
		onkeydown={(e) => e.key === "Escape" && (search = "")}
	/>

	{#each STATUSES as s}
		<button
			class="chip"
			class:active={statusFilter === s.value}
			onclick={() => setParam("status", s.value)}
		>
			{s.label}
			<small>{s.value ? (statusCounts[s.value] ?? 0) : groupItems.length}</small>
		</button>
	{/each}

	<span class="shown">{visibleItems.length} shown</span>
</div>

<a class="pending-link" href={`${config.basePath}/admin/create/content?course=${encodeURIComponent(course.slug)}`}>
	New
</a>

<a class="pending-link" href={`${config.basePath}/admin/create/bulk-content?course=${encodeURIComponent(course.slug)}`}>
	Bulk Create
</a>
<a class="pending-link" href={`${config.basePath}/admin/create/bulk-update?course=${encodeURIComponent(course.slug)}`}>
	Bulk Update
</a>

<a class="pending-link" href={`${config.basePath}/admin/create/bulk-group?course=${encodeURIComponent(course.slug)}`}>
	Bulk Groups
</a>

<a class="pending-link" href={`${config.basePath}/admin/create/group?course=${encodeURIComponent(course.slug)}`}>
	Add Group
</a>

<a class="pending-link" href={`${config.basePath}/admin/groups?course=${encodeURIComponent(course.slug)}`}>
	Edit Groups
</a>
<div class="links-container">
	<HomeLinks homeLinks={visibleItems} />

</div>

	</div>

	<br/>
	<br/>
<Footer />
{/if}



<style>

.links-container{
	padding:.15rem;
}
.container {
    min-height: 100vh;
    margin: 0;
    padding: 0;
    background: var(--theme-panel);
    color: var(--theme-text);
}

.filter-bar {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 8px;
	margin: 0 0 .5rem;
}

.filter-bar input {
	flex: 1;
	min-width: 220px;
	max-width: 420px;
	padding: .55rem .8rem;
	font: inherit;
	color: var(--theme-text);
	background: var(--theme-panel);
	border: 1px solid var(--theme-border);
	border-radius: 7px;
}

.filter-bar input:focus {
	outline: none;
	border-color: #5fa8ff;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: .45rem .75rem;
	font: inherit;
	font-size: .9rem;
	color: var(--theme-text);
	background: transparent;
	border: 1px solid var(--theme-border);
	border-radius: 999px;
	cursor: pointer;
}

.chip small {
	opacity: .7;
	font-size: .75rem;
}

.chip:hover {
	border-color: #5fa8ff;
}

.chip.active {
	background: rgba(95, 168, 255, .2);
	border-color: #5fa8ff;
}

.shown {
	margin-left: auto;
	opacity: .7;
	font-size: .85rem;
}

.pending-link {
	display: inline-block;
	margin: .75rem .15rem;
	padding: .5rem .8rem;
	color: #d9f99d;
	background: #3f3a16;
	border: 1px solid #a3a322;
	border-radius: 6px;
	text-decoration: none;
}

.pending-link:hover {
	background: #514d18;
	border-color: #c4c43a;
}
</style>