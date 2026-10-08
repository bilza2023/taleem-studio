<!-- src/lib/components/home/Section.svelte -->
<script>
	let { id = "", title = "", subtitle = "", alt = false, children } = $props();
</script>

<section {id} class="home-section" class:alt>
	<div class="inner">
		{#if title}
			<header class="section-head">
				<h2>{title}</h2>
				{#if subtitle}<p>{subtitle}</p>{/if}
			</header>
		{/if}

		{@render children?.()}
	</div>
</section>

<style>
	.home-section {
		padding: 4rem 1rem;
		color: var(--theme-text, #1a1a1a);
	}

	.home-section.alt {
		background: var(--theme-panel, #f5f7fb);
	}

	.inner {
		width: min(100%, 1150px);
		margin: 0 auto;
	}

	.section-head {
		margin-bottom: 2rem;
	}

	.section-head h2 {
		margin: 0 0 0.4rem;
		font-size: clamp(1.6rem, 3vw, 2.2rem);
	}

	.section-head p {
		margin: 0;
		opacity: 0.75;
	}

	@media (max-width: 600px) {
		.home-section {
			padding: 2.5rem 1rem;
		}
	}
</style>