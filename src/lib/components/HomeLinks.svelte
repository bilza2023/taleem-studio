<script>
///home/bilal-tariq/00--TALEEM/taleem/src/lib/components/HomeLinks.svelte
	import { config } from "$lib/config.js";

	// groupTitles (optional): { [groupSlug]: "Chapter 12: Introduction" }
	let { homeLinks = [], groupTitles = {} } = $props();

	function getPlayHref(card) {
		switch (card.type) {
			case "ARTICLE":
				return `${config.basePath}/articles?article=${encodeURIComponent(card.slug)}`;
			case "PLAYER":
				return `${config.basePath}/player?lesson=${encodeURIComponent(card.slug)}`;
			case "MCQ":
				return `${config.basePath}/mcq?mcq=${encodeURIComponent(card.slug)}`;
			default:
				return "#";
		}
	}

	// "Fbise8math Ch12 Histogram" → "Ch12 Histogram" (course name is already in the header)
	function displayTitle(card) {
		const title = card.title ?? card.slug;
		if (!card.courseSlug) return title;
		const prefix = card.courseSlug.toLowerCase() + " ";
		return title.toLowerCase().startsWith(prefix)
			? title.slice(prefix.length)
			: title;
	}
</script>

<div class="grid">
	{#each homeLinks as card (card.slug)}
		{@const draft = card.status === "DRAFT"}
		<svelte:element
			this={draft ? "div" : "a"}
			class={`card ${card.type?.toLowerCase()} ${draft ? "draft" : ""}`}
			href={draft ? undefined : getPlayHref(card)}
			data-sveltekit-reload={draft ? undefined : true}
			aria-disabled={draft || undefined}
		>
			{#if draft}
				<span class="badge">Coming soon</span>
			{/if}

			{#if card.image}
				<img src={`${config.basePath}/content/images/${card.image}`} alt={card.title} />
			{/if}

			<div class="content">
				<h2 class="title" title={card.title}>{displayTitle(card)}</h2>

				<div class="meta">
					<span class="group">{groupTitles[card.groupSlug] ?? card.groupSlug}</span>
				</div>
			</div>
		</svelte:element>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 20px;
		margin-top: 24px;
	}

	/* ---------- card ---------- */
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		color: inherit;
		text-decoration: none;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
		transition: transform .15s ease, border-color .2s ease, box-shadow .2s ease;
		cursor: pointer;
	}

	.card:hover {
		transform: translateY(-2px);
		border-color: var(--pico-primary);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
	}

	/* subtle top-lit gradient instead of flat fills */
	.card.player  { background: linear-gradient(180deg, #34573c 0%, #2a4631 100%); }
	.card.article { background: linear-gradient(180deg, #2a6878 0%, #22535f 100%); }
	.card.mcq     { background: linear-gradient(180deg, #634677 0%, #4f375f 100%); }

	.card img {
		display: block;
		width: calc(100% - 8px);
		height: 140px;
		object-fit: cover;
		margin: 4px;
		border-radius: 8px;
	}

	/* ---------- content ---------- */
	.content {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 10px 14px 12px;
		color: #fff;
	}

	.title {
		margin: 0;
		font-family: Georgia, "Times New Roman", serif;
		font-size: 1.02rem;
		font-weight: 600;
		line-height: 1.35;
		letter-spacing: .01em;
		color: #fff;

		/* max 2 lines, then … */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		min-height: calc(1.35em * 2); /* equal height even for 1-line titles */
	}

	/* group pinned to the bottom, separated by a hairline */
	.meta {
		margin-top: auto;
		padding-top: 10px;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		margin-top: 12px;
	}

	.group {
		display: inline-block;
		max-width: 100%;
		padding: .15rem .6rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.14);
		font-size: .72rem;
		font-weight: 500;
		letter-spacing: .03em;
		color: rgba(255, 255, 255, 0.78);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		box-sizing: border-box;
	}

	/* ---------- drafts: visible promise, not clickable ---------- */
	.card.draft {
		cursor: default;
	}

	.card.draft img,
	.card.draft .content {
		opacity: .4;
		filter: grayscale(.7);
	}

	.card.draft:hover {
		transform: none;
		border-color: rgba(255, 255, 255, 0.18);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}

	.badge {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 1;
		padding: .15rem .6rem;
		border-radius: 999px;
		background: #f5b82e;
		color: #1a1a1a;
		font-size: .7rem;
		font-weight: 700;
		letter-spacing: .06em;
		text-transform: uppercase;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
	}
</style>