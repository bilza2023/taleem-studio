<svelte:head>
	<title>Taleem.help — Pakistan's Online Academy</title>
	<meta name="description" content="Online FBISE classes 8, 9 and 10 with step-by-step lessons and teacher support." />
</svelte:head>

<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import Hero from "$lib/components/home/Hero.svelte";
	import ClassesSection from "$lib/components/home/ClassesSection.svelte";
	import DemosSection from "$lib/components/home/DemosSection.svelte";
	import WhyTaleemSection from "$lib/components/home/WhyTaleemSection.svelte";

	import SiteFooter from "$lib/components/home/SiteFooter.svelte";

	let samples = [];

	onMount(async () => {
		try {
			const items = await send("library", "listByTag", { tag: "pinned", courseSlug: "blog" });

			samples = items.map((item) => ({
				type: item.type,
				slug: item.slug,
				title: item.title,
				groupSlug: item.groupSlug,
				image: item.thumbnail
			}));
			
			console.log("samples" ,samples);

		} catch (error) {
			console.error(error);
		}
	});
</script>



<Hero />
<DemosSection {samples} />
<ClassesSection />
<WhyTaleemSection />
<!-- <FeesSection /> -->
<!-- <FaqSection /> -->

<SiteFooter />