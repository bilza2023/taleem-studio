<script>
	import { config } from "$lib/config.js";

	let { homeLinks = [] } = $props();

	const accessIcons = {
		open: "🔓",
		members: "👥",
		subscription: "💳"
	};

	const statusIcons = {
		DRAFT: "📝",
		PUBLISHED: "✅",
		ARCHIVED: "🗄️"
	};

	function getFlags(card) {
		return {
			hasNarration: !!card.hasNarration,
			hasDeck: !!card.hasDeck,
			hasAudio: !!card.hasAudio
		};
	}

	function getPlayHref(card) {
		switch (card.type) {
			case "ARTICLE":
				return `${config.basePath}/admin/articles?article=${encodeURIComponent(card.slug)}`;
			case "PLAYER":
				return `${config.basePath}/admin/player?lesson=${encodeURIComponent(card.slug)}`;
			default:
				return "#";
		}
	}

	function getEditHref(card) {
		return `${config.basePath}/admin/edit/content?course=${encodeURIComponent(card.courseSlug)}&group=${encodeURIComponent(card.groupSlug)}&slug=${encodeURIComponent(card.slug)}&role=${encodeURIComponent(card.type)}`;
	}
</script>

<div class="grid">
	{#each homeLinks as card}
		<div class={`card ${card.type?.toLowerCase()}`}>
			{#if card.image}
<img src={`${config.basePath}/content/images/${card.image}`} alt={card.title} />
			{/if}

			<div class="content">

				{#if card.type === "PLAYER"}
					{@const f = getFlags(card)}
					<div class="status-row">
						<span class:off={!f.hasNarration} title={f.hasNarration ? "Narration ✓" : "No narration"}>📄</span>
						<span class:off={!f.hasDeck} title={f.hasDeck ? "Deck ✓" : "No deck"}>🎞️</span>
						<span class:off={!f.hasAudio} title={f.hasAudio ? "Real audio ✓" : "No real audio"}>
							{f.hasAudio ? "🔊" : "🔇"}
						</span>
						<span class="status" title={card.status}>
							{statusIcons[card.status] ?? card.status}
						</span>
					</div>
				{/if}

								<div class="field">
					<span class="label">Slug</span>
					<code
						class="slug"
						title="Click to copy"
						onclick={() => navigator.clipboard?.writeText(card.slug)}
					>{card.slug}</code>
				</div>

				<div class="field">
					<span class="label">Title</span>
					<h2>{card.title}</h2>
				</div>

				<div class="field">
					<span class="label">Group</span>
					<p>{card.groupSlug}</p>
				</div>

				{#if accessIcons[card.access?.toLowerCase()]}
					<div class="field">
						<span class="label">Access</span>
						<span class="access-icon" title={card.access}>
							{accessIcons[card.access.toLowerCase()]}
						</span>
					</div>
				{/if}
			</div>

			<div class="actions">
				<a class="action play" href={getPlayHref(card)}>
					▶ Play
				</a>

				<a class="action edit" href={getEditHref(card)}>
					✎ Edit
				</a>
			</div>
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 20px;
		margin-top: 24px;
	}

	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		color: inherit;
		border: 1px solid var(--pico-muted-border-color);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		transition: transform .15s ease, border-color .2s ease, box-shadow .2s ease;
	}

	.card:hover {
		transform: translateY(-2px);
		border-color: var(--pico-primary);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	}

	.card.article { background: #265f6d; }
	.card.player  { background: #2f4e36; }

	.card img {
		display: block;
		width: calc(100% - 8px);
		height: 140px;
		object-fit: cover;
		margin: 4px;
		border-radius: 8px;
	}

	.content {
		padding: 8px 12px 10px;
		color: white;
	}

		.status-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 8px;
		font-size: 1rem;
		line-height: 1;
	}

	.status-row span {
		cursor: default;
	}

	/* present = lit chip */
	.status-row span:not(.status) {
		padding: 3px 5px;
		border-radius: 6px;
		background: rgba(125, 220, 138, .28);
		border: 1px solid rgba(125, 220, 138, .75);
	}

	/* absent = no chip, faded */
	.status-row span.off {
		background: transparent;
		border-color: transparent;
		opacity: .2;
		filter: grayscale(1);
	}

	.status-row .status {
		margin-left: auto;
	}


	.field {
		display: flex;
		align-items: baseline;
		gap: 6px;
		margin-bottom: 6px;
		font-size: .85rem;
	}

	.label {
		font-size: .7rem;
		font-weight: 600;
		opacity: .65;
		text-transform: uppercase;
		letter-spacing: .04em;
		white-space: nowrap;
	}

	.field h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.35;
		color: white;
	}

	.field p {
		margin: 0;
		font-size: .85rem;
		color: white;
		font-weight: 500;
	}

	.access-icon {
		font-size: .95rem;
		line-height: 1;
	}

	.actions {
		display: flex;
		gap: 8px;
		padding: 8px 12px 12px;
		margin-top: auto;
	}

	.action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 7px 14px;
		border: 1px solid #777;
		border-radius: 6px;
		color: inherit;
		text-decoration: none;
		font-size: .8rem;
		font-weight: 600;
		background: rgba(0, 0, 0, .08);
	}

	.action:hover {
		background: rgba(0, 0, 0, .25);
	}

	.play {
		flex: 1;
	}

	.edit {
		min-width: 55px;
	}
		.slug {
		font-family: ui-monospace, monospace;
		font-size: .78rem;
		color: #d9f99d;
		background: rgba(0, 0, 0, .25);
		padding: 2px 6px;
		border-radius: 4px;
		overflow-wrap: anywhere;
		cursor: copy;
	}

	.slug:hover {
		background: rgba(0, 0, 0, .45);
	}
</style>