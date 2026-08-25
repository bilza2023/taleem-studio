<script>
	import { config } from "$lib/config.js";

	let { homeLinks = [] } = $props();

	function getPlayHref(card) {
		switch (card.type) {
			case "ARTICLE":
				return `${config.basePath}/articles?article=${encodeURIComponent(card.slug)}`;
			case "PLAYER":
				return `${config.basePath}/player?lesson=${encodeURIComponent(card.slug)}`;
			default:
				return "#";
		}
	}

	function getEditHref(card) {
		return `${config.basePath}/edit/${card.type.toLowerCase()}?course=${encodeURIComponent(card.courseSlug)}&group=${encodeURIComponent(card.groupSlug)}&slug=${encodeURIComponent(card.slug)}`;
	}
</script>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 20px;
		margin-top: 24px;
	}

	.card {
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

	.card.open { background: #9db6a4; }
	.card.members { background: #737c8b; }
	.card.subscription { background: #b4a78f; }

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

	.field {
		margin-bottom: 8px;
	}

	.label {
		display: block;
		margin-bottom: 2px;
		font-size: .7rem;
		font-weight: 600;
		opacity: .65;
		text-transform: uppercase;
		letter-spacing: .04em;
	}

	.content h2 {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.35;
		color: white;
	}

	.content p {
		margin: 0;
		font-size: .85rem;
		color: white;
		font-weight: 500;
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
</style>

<div class="grid">
	{#each homeLinks as card}
		<div class={`card ${card.access?.toLowerCase()}`}>
			{#if card.image}
				<img src={card.image} alt={card.title} />
			{/if}

			<div class="content">
				<div class="field">
					<span class="label">Title</span>
					<h2>{card.title}</h2>
				</div>

				<div class="field">
					<span class="label">Group</span>
					<p>{card.groupSlug}</p>
				</div>
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