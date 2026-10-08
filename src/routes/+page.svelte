
<script>
	import Hero from "$lib/components/home/Hero.svelte";
	import ClassesSection from "$lib/components/home/ClassesSection.svelte";
	import DemosSection from "$lib/components/home/DemosSection.svelte";
	import WhyTaleemSection from "$lib/components/home/WhyTaleemSection.svelte";
	// import FeesSection from "$lib/components/home/FeesSection.svelte";
	// import FaqSection from "$lib/components/home/FaqSection.svelte";
		import SiteFooter from "$lib/components/home/SiteFooter.svelte";
</script>

<svelte:head>
	<title>Taleem.help — Pakistan's Online Academy</title>
	<meta name="description" content="Online FBISE classes 8, 9 and 10 with step-by-step lessons and teacher support." />
</svelte:head>

<Hero />
<ClassesSection />
<DemosSection />
<WhyTaleemSection />
<!-- <FeesSection /> -->
<!-- <FaqSection /> -->

<SiteFooter />