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

// URL is the source of truth
let courseSlug = $derived(page.url.searchParams.get("course"));

let selectedGrouping = $derived.by(() => {
	const g = page.url.searchParams.get("group") ?? "";
	// unknown / stale group in URL → fall back to "All"
	return groupings.some(x => x.slug === g) ? g : "";
});

let visibleItems = $derived(
	!selectedGrouping
		? home?.items ?? []
		: (home?.items ?? []).filter(
			item => item.groupSlug === selectedGrouping
		)
);

function handleGroupingChange(id) {
	const url = new URL(page.url);

	if (id) url.searchParams.set("group", id);
	else url.searchParams.delete("group");

	goto(url, { replaceState: true, noScroll: true, keepFocus: true });
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