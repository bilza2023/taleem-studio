<script>
	import { onMount } from "svelte";
	import { admin } from "$lib/api/admin.js";
	import CourseLinks from "$lib/components/CourseLinks.svelte";
	import Footer from "$lib/components/Footer.svelte";
	import { frontend } from "$lib/frontEnd";

	let active = $state("courses");
	let home = $state(null);
	let error = $state("");

	async function loadCourses(id = "courses") {
		active = id;

		try {
			error = "";

			const items = await admin.get("/");

			home = {
				items: items.map(item => ({
					...item,
					image: item.thumbnail
				}))
			};
				if(frontend){	
				// const f = await frontend.course.get( "fbise9math");;
				const f = await frontend.course.list();;
					console.log("frontend" , f);
				}
		} catch (err) {
			error = err.message;
		}
	}

	onMount(() => {
		loadCourses();
	});
</script>
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