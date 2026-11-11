<script>
	import HomeLinks from "$lib/components/HomeLinks.svelte";

	let { samples = [] } = $props();
</script>

{#if samples.length}
	<section id="samples" class="samples-strip">
		<div class="inner">
			<h2>Sample Lessons</h2>
			<HomeLinks homeLinks={samples} />
		</div>
	</section>
{/if}

<style>
	.samples-strip {
		background: rgba(5, 0, 22, 0.035);
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		padding: 1.75rem 1rem 3.5rem;
		scroll-margin-top: 70px; /* keeps heading clear of navbar on #samples jump */
	}

	.inner {
		width: min(100%, 1400px);
		margin: 0 auto;
	}

	h2 {
		margin: 0 0 1.5rem;
		text-align: center;
		font-size: clamp(1.4rem, 2.5vw, 1.9rem);
		font-weight: 700;
		letter-spacing: 0.02em;
		color: rgba(223, 230, 245, 0.7);
	}

	@media (max-width: 600px) {
		.samples-strip {
			padding: 1.25rem 0.75rem 2.5rem;
		}
	}
</style>