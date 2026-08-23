
<script>
	import HomeLinks from "$lib/components/HomeLinks.svelte";
	import CourseHero from "$lib/components/CourseHero.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { page } from "$app/state";
	import GroupingNav from "$lib/components/GroupingNav.svelte";

	let home = $state(null);
	let course = $state(null);
	let error = $state("");
	let selectedGrouping = $state("");

	let visibleItems = $derived(
		!selectedGrouping
			? home?.items ?? []
			: (home?.items ?? []).filter(
				item => item.groupSlug === selectedGrouping
			)
	);

	function handleGroupingChange(id) {
		selectedGrouping = id;
	}

	async function loadLibrary(courseSlug) {
		try {
			error = "";

			const res = await fetch(
				`/lessons?course=${encodeURIComponent(courseSlug)}`
			);

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to load course");
			}

			course = data.course;

			home = {
				items: data.items.map(item => ({
					...item,
					image: `/content/images/${item.thumbnail}`
				}))
			};
		} catch (err) {
			error = err.message;
		}
	}

	$effect(() => {
		const courseSlug = page.url.searchParams.get("course");

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
	groupings={course.groupings}
	value={selectedGrouping}
	onChange={handleGroupingChange}
/>
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

</style>