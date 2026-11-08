<!-- /src/lib/mcq/QuestionNav.svelte -->
<script>
	let {
		count,
		index,
		statuses = [],   // per question: "ok" | "bad" | "answered" | ""
		onGo             // (i: number) => void
	} = $props();
</script>

<footer class="nav">
	<button class="outline" disabled={index === 0} onclick={() => onGo(index - 1)}>← Prev</button>

	<div class="dots">
		{#each { length: count } as _, i}
			<button
				class="dot"
				class:current={i === index}
				class:answered={statuses[i] === "answered"}
				class:ok={statuses[i] === "ok"}
				class:bad={statuses[i] === "bad"}
				onclick={() => onGo(i)}
			>{i + 1}</button>
		{/each}
	</div>

	<button class="outline" disabled={index === count - 1} onclick={() => onGo(index + 1)}>Next →</button>
</footer>
<style>
	.nav {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		justify-content: space-between;
		padding: 0.6rem 0.9rem;
		background: var(--mcq-card);
		border: 1px solid var(--mcq-border);
		border-radius: var(--mcq-radius);
	}

	button {
		width: auto;
		margin: 0;
		font: inherit;
		padding: 0.45rem 1rem;
		border-radius: 8px;
		border: 1px solid var(--mcq-border);
		background: var(--mcq-card-hi);
		color: var(--mcq-text);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
	}
	button:hover:not(:disabled) {
		border-color: var(--mcq-accent);
	}
	button:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.dots {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		justify-content: center;
	}
	.dot {
		width: 2.2rem;
		height: 2.2rem;
		padding: 0;
		border-radius: 50%;
		font-size: 0.85rem;
		font-weight: 600;
		background: var(--mcq-bg);
		border: 2px solid var(--mcq-border);
		color: var(--mcq-muted);
	}
	.dot.current {
		border-color: var(--mcq-accent);
		color: #fff;
		box-shadow: 0 0 0 3px var(--mcq-accent-soft);
	}
	.dot.answered {
		background: var(--mcq-accent-soft);
		color: var(--mcq-text);
	}
	.dot.ok {
		background: var(--mcq-ok-soft);
		border-color: var(--mcq-ok);
		color: var(--mcq-ok);
	}
	.dot.bad {
		background: var(--mcq-bad-soft);
		border-color: var(--mcq-bad);
		color: var(--mcq-bad);
	}
</style>