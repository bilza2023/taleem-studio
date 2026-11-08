<!-- /src/lib/mcq/SlideFrame.svelte -->
<script>
	import Scene from "$lib/taleemUI/Scene.svelte";
	import Background from "$lib/taleemUI/Background.svelte";
	import TaleemSlide from "$lib/taleem-slides/TaleemSlide.svelte";

	// slide: the exact slide to draw (question / hint / answer), chosen by the MCQ engine
	let { slide, background = undefined, theme = undefined } = $props();

	let width = $state(0);
	let height = $state(0);

	// Static slide: every item visible at time 0
	const staticSlide = $derived({
		...slide,
		data: slide.data.map((item) =>
			Array.isArray(item) ? item : { showAt: 0, ...item }
		)
	});
</script>

<div class="slide-frame" bind:clientWidth={width} bind:clientHeight={height}>
	{#if width && height}
		<Scene {width} {height}>
			<Background {background}>
				<TaleemSlide slide={staticSlide} currentTime={0} {width} {height} {theme} />
			</Background>
		</Scene>
	{/if}
</div>

<style>
	.slide-frame {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		overflow: hidden;
		border-radius: 8px;
	}
</style>