<script>
	import { onMount } from "svelte";
	import CourseLinks from "$lib/components/CourseLinks.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import SubNav from "$lib/components/SubNav.svelte";

	let active = $state("courses");
	let home = $state(null);
	let error = $state("");

	async function loadCourses(id = "courses") {
		active = id;

		try {
			error = "";

			const res = await fetch("/courses");
			const items = await res.json();

			if (!res.ok) throw new Error(items.error || "Failed to load courses");

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

	onMount(() => {
		loadCourses();
	});
</script>

<SubNav active={active} />

{#if error}
	<p>{error}</p>
{:else if !home}
	<p>Loading...</p>
{:else}
	<div class="container">
		<CourseLinks homeLinks={home.items} />
	</div>

	<br />
	<br />
	<Footer />
{/if}

<style>
	.container {
		padding: 10px;
		margin: 10px;
		min-height: 100vh;
	}
</style>