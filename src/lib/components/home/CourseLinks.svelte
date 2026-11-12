<!-- src/lib/components/home/CourseLinks.svelte -->
<script>
	import EmblaCarousel from "embla-carousel";
	import { config } from "$lib/config.js";

	let { homeLinks = [] } = $props();

	let viewport;
	let api;
	let canPrev = $state(false);
	let canNext = $state(false);

	const rs = (n) => "Rs " + Number(n).toLocaleString("en-PK");
	const browseHref = (c) => `${config.basePath}/course?course=${encodeURIComponent(c.slug)}`;
	const buyHref = (c) => `${config.basePath}/admissions?course=${encodeURIComponent(c.slug)}`;

	$effect(() => {
		if (!viewport) return;
		api = EmblaCarousel(viewport, {
			align: "start",
			dragFree: true,
			containScroll: "trimSnaps"
		});
		const update = () => {
			canPrev = api.canScrollPrev();
			canNext = api.canScrollNext();
		};
		api.on("init", update).on("select", update).on("scroll", update).on("reInit", update);
		update();
		return () => api.destroy();
	});
</script>

<div class="shelf" class:fade-left={canPrev} class:fade-right={canNext}>
	{#if canPrev}
		<button class="arrow left" aria-label="Previous courses" onclick={() => api?.scrollPrev()}>‹</button>
	{/if}

	<div class="viewport" bind:this={viewport}>
		<div class="track">
			{#each homeLinks as c (c.slug)}
				<article class={`card ${c.access?.toLowerCase() ?? ""}`}>
					{#if c.tag}<span class="ribbon">{c.tag}</span>{/if}

					<a class="thumb" href={browseHref(c)} tabindex="-1">
						{#if c.image}
							<img src={`${config.basePath}/content/images/${c.image}`} alt={c.title} loading="lazy" />
						{/if}
					</a>

					<div class="body">
						{#if c.subject}<span class="subject">{c.subject}</span>{/if}
						<h3>{c.title}</h3>
						{#if c.description}<p class="desc">{c.description}</p>{/if}

						{#if c.highlights?.length}
							<ul class="hl">
								{#each c.highlights as h}<li>{h}</li>{/each}
							</ul>
						{/if}

						{#if c.price}
							<div class="price">
								<div class="main">
									<span class="amt">{rs(c.price.year)}</span>
									<span class="per">/ year</span>
									{#if c.price.half && c.price.half * 2 > c.price.year}
										<span class="save">Save {rs(c.price.half * 2 - c.price.year)}</span>
									{/if}
								</div>
								{#if c.price.half}
									<div class="alt">or {rs(c.price.half)} for 6 months</div>
								{/if}
							</div>
						{/if}

						<div class="actions">
							<a class="btn ghost" href={browseHref(c)}>Browse</a>
							<a class="btn gold" href={buyHref(c)}>Subscribe</a>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</div>

	{#if canNext}
		<button class="arrow right" aria-label="More courses" onclick={() => api?.scrollNext()}>›</button>
	{/if}
</div>

<style>
	.shelf {
		position: relative;
		--gold: #f5b932;
		--gold-soft: rgba(245, 185, 50, 0.45);
	}

	/* soft edge fade only on the side that has more cards */
	.shelf.fade-right .viewport {
		mask-image: linear-gradient(to right, #000 88%, transparent);
	}
	.shelf.fade-left .viewport {
		mask-image: linear-gradient(to left, #000 88%, transparent);
	}
	.shelf.fade-left.fade-right .viewport {
		mask-image: linear-gradient(to right, transparent, #000 6%, #000 94%, transparent);
	}

	/* vertical padding so the glow isn't clipped */
	.viewport {
		overflow: hidden;
		padding: 1.75rem 0 1.5rem;
	}

	.track {
		display: flex;
		gap: 1.5rem;
		padding: 0 0.75rem;
		touch-action: pan-y pinch-zoom;
				justify-content: safe center;
	}

	/* ---------- card ---------- */
	.card {
		position: relative;
		flex: 0 0 auto;
		width: min(82vw, 330px);
		display: flex;
		flex-direction: column;
		border-radius: 18px;
		background:
			radial-gradient(120% 60% at 50% 0%, rgba(245, 185, 50, 0.1), transparent 60%),
			linear-gradient(180deg, #17234a 0%, #0d1530 100%);
		border: 1.5px solid var(--gold-soft);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.03) inset,
			0 10px 30px rgba(0, 0, 0, 0.45),
			0 0 22px rgba(245, 185, 50, 0.12);
		transition: transform 0.2s ease, box-shadow 0.25s ease, border-color 0.25s ease;
	}

	.card:hover {
		transform: translateY(-4px);
		border-color: var(--gold);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.04) inset,
			0 16px 40px rgba(0, 0, 0, 0.5),
			0 0 34px rgba(245, 185, 50, 0.3);
	}

	.ribbon {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 2;
		padding: 0.3rem 0.85rem;
		border-radius: 999px;
		background: var(--gold);
		color: #1a1300;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		box-shadow: 0 0 16px rgba(245, 185, 50, 0.55);
	}

	.thumb {
		display: block;
		margin: 8px 8px 0;
		border-radius: 12px;
		overflow: hidden;
		background: #0a0f22;
	}

	.thumb img {
		display: block;
		width: 100%;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		transition: transform 0.35s ease;
	}

	.card:hover .thumb img {
		transform: scale(1.03);
	}

	.body {
		display: flex;
		flex-direction: column;
		flex: 1;
		padding: 1rem 1.15rem 1.15rem;
	}

	.subject {
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #5fd4e6;
	}

	h3 {
		margin: 0.25rem 0 0.35rem;
		font-family: inherit;
		font-size: 1.3rem;
		font-weight: 700;
		color: #fff;
	}

	.desc {
		margin: 0 0 0.75rem;
		font-size: 0.86rem;
		line-height: 1.45;
		color: #aab6d3;
	}

	.hl {
		list-style: none;
		margin: 0 0 1rem;
		padding: 0;
	}

	.hl li {
		position: relative;
		padding-left: 1.4rem;
		margin: 0.3rem 0;
		font-size: 0.82rem;
		color: #d5dcef;
	}

	.hl li::before {
		content: "✓";
		position: absolute;
		left: 0;
		color: var(--gold);
		font-weight: 700;
	}

	/* ---------- price ---------- */
	.price {
		margin-top: auto;
		padding: 0.75rem 0.85rem;
		border-radius: 12px;
		background: rgba(245, 185, 50, 0.07);
		border: 1px dashed rgba(245, 185, 50, 0.35);
	}

	.main {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.amt {
		font-size: 1.65rem;
		font-weight: 800;
		color: var(--gold);
		text-shadow: 0 0 18px rgba(245, 185, 50, 0.35);
		line-height: 1.1;
	}

	.per {
		font-size: 0.85rem;
		color: #c9d2ea;
	}

	.save {
		margin-left: auto;
		padding: 0.15rem 0.5rem;
		border-radius: 6px;
		background: rgba(46, 204, 113, 0.15);
		color: #4ee38a;
		font-size: 0.7rem;
		font-weight: 700;
	}

	.alt {
		margin-top: 0.2rem;
		font-size: 0.8rem;
		color: #9aa7c7;
	}

	/* ---------- buttons ---------- */
	.actions {
		display: grid;
		grid-template-columns: 1fr 1.4fr;
		gap: 0.6rem;
		margin-top: 0.9rem;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 0.5rem;
		border-radius: 10px;
		font-size: 0.95rem;
		font-weight: 700;
		text-decoration: none;
		transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
	}

	.btn.ghost {
		border: 1px solid rgba(255, 255, 255, 0.28);
		color: #fff;
		background: transparent;
	}

	.btn.ghost:hover {
		background: rgba(255, 255, 255, 0.07);
		border-color: #fff;
	}

	.btn.gold {
		background: var(--gold);
		color: #1a1300;
		box-shadow: 0 6px 18px rgba(245, 185, 50, 0.35);
	}

	.btn.gold:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 26px rgba(245, 185, 50, 0.55);
	}

	/* ---------- arrows ---------- */
	.arrow {
		position: absolute;
		top: 50%;
		z-index: 3;
		transform: translateY(-50%);
		width: 44px;
		height: 44px;
		padding: 0;
		border-radius: 50%;
		border: 1px solid var(--gold-soft);
		background: rgba(13, 21, 48, 0.9);
		color: var(--gold);
		font-size: 1.8rem;
		line-height: 1;
		cursor: pointer;
		box-shadow: 0 0 16px rgba(245, 185, 50, 0.25);
	}

	.arrow:hover {
		border-color: var(--gold);
		background: #17234a;
	}

	.arrow.left {
		left: -6px;
	}

	.arrow.right {
		right: -6px;
	}

	@media (hover: none) {
		.arrow {
			display: none; /* touch users swipe */
		}
	}
</style>