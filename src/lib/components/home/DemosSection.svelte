<!-- src/lib/components/home/DemosSection.svelte -->
<script>
	import Section from "./Section.svelte";

	// slug  → the lesson slug from your library
	// image → optional thumbnail in /static (e.g. "/samples/class9.webp"); leave "" for the play panel
	const demos = [
		{ title: "SAMPLE-1-TITLE", meta: "Class 8 · Mathematics", slug: "SAMPLE-1-SLUG", image: "" },
		{ title: "SAMPLE-2-TITLE", meta: "Class 9 · Mathematics", slug: "SAMPLE-2-SLUG", image: "" },
		{ title: "SAMPLE-3-TITLE", meta: "Class 10 · Mathematics", slug: "SAMPLE-3-SLUG", image: "" }
	];
</script>

<Section id="samples" title="Samples" subtitle="Watch a real lesson and see how Taleem.help teaches.">
	<div class="grid">
		{#each demos as d}
			<a class="demo" href={`/player?lesson=${encodeURIComponent(d.slug)}`}>
				<div class="thumb">
					{#if d.image}
						<img src={d.image} alt={d.title} />
					{/if}
					<span class="play">▶</span>
				</div>
				<div class="info">
					<h3>{d.title}</h3>
					<p>{d.meta}</p>
				</div>
			</a>
		{/each}
	</div>
</Section>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 20px;
		margin-top: 24px;
	}

	.demo {
		display: block;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.04);
		color: #fff;
		text-decoration: none;
		transition: transform 0.15s, border-color 0.15s;
	}

	.demo:hover {
		transform: translateY(-2px);
		border-color: #f5b82e;
	}

	.thumb {
		position: relative;
		aspect-ratio: 16 / 9;
		display: grid;
		place-items: center;
		background: radial-gradient(circle, rgba(245, 184, 46, 0.12), #090d1f 75%);
	}

	.thumb img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.7;
	}

	.play {
		position: relative;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		display: grid;
		place-items: center;
		background: #f5b82e;
		color: #090d1f;
		font-size: 1.3rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
		transition: transform 0.15s;
	}

	.demo:hover .play {
		transform: scale(1.1);
	}

	.info {
		padding: 1rem 1.25rem;
	}

	h3 {
		margin: 0 0 0.25rem;
		font-size: 1.05rem;
	}

	p {
		margin: 0;
		font-size: 0.88rem;
		opacity: 0.7;
	}
</style>