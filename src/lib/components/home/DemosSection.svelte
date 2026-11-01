<!-- src/lib/components/home/DemosSection.svelte -->
<!-- src/lib/components/home/DemosSection.svelte -->
<script>
	import Section from "./Section.svelte";
	import HomeLinks from "$lib/components/HomeLinks.svelte";

	export let samples = [];
</script>

{#if samples.length}
<Section id="samples" title="Samples" subtitle="Watch a real lesson and see how Taleem.help teaches.">
	<HomeLinks homeLinks={samples} />
</Section>
{/if}
