<script>
	import EnrollButton from "./EnrollButton.svelte";
	import { config } from "$lib/config.js";

	let { course } = $props();

	let priceText = $derived(`Rs ${course.price.toLocaleString("en-PK")}`);
</script>

<article class="card">
	<header>
		<h3>{course.title}</h3>
		<p class="subtitle">{course.subtitle}</p>
	</header>

	<ul class="includes">
		{#each course.includes as line}
			<li>{line}</li>
		{/each}
	</ul>

	<div class="price">
		<span class="amount">{priceText}</span>
		<span class="per">/ {course.duration}</span>
	</div>

	<div class="actions">
		<EnrollButton courseTitle={course.title} mode="Online" />

		{#if course.sampleHref}
			<a class="sample" href={`${config.basePath}${course.sampleHref}`}>
				Watch a sample first
			</a>
		{/if}
	</div>
</article>

<style>
	.card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		margin: 0;
		border: 1px solid var(--theme-border);
		border-radius: 14px;
		background: color-mix(in srgb, var(--theme-panel) 92%, var(--theme-text));
		color: var(--theme-text);
	}

	h3 {
		margin: 0;
		font-size: 1.4rem;
	}

	.subtitle {
		margin: 0.2rem 0 0;
		font-size: 0.9rem;
		opacity: 0.75;
	}

	.includes {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
		font-size: 0.95rem;
	}

	.includes li::before {
		content: "✓";
		color: #bbe793;
		font-weight: 700;
		margin-right: 0.5rem;
	}

	.price {
		margin-top: auto;
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
	}

	.amount {
		font-size: 1.8rem;
		font-weight: 700;
		color: #f5b82e;
	}

	.per {
		opacity: 0.75;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	.sample {
		text-align: center;
		font-size: 0.9rem;
		color: var(--theme-accent);
	}
</style>