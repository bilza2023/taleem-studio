<!-- src/lib/components/home/Hero.svelte -->
<script>
	const samplesHref = "#samples";
	const admissionsHref = "/admissions"; // swap to "/admissions" once that page exists

	const trust = [
		"Federal Board syllabus",
		"Step-by-step solutions",
		"Campus: Bahria Town Phase 8, Rawalpindi"
	];
</script>

<section class="hero">
	<div class="inner">
		<p class="tagline">Taleem.help — Pakistan's Online Academy</p>

		<h1>Video courses for Federal Board students.</h1>

		<p class="sub">
			One course for each book, question by question. Every exercise explained
			step by step, and your own questions answered.
		</p>

		<p class="detail">Class 8 · 9 · 10 Math · New curriculum</p>

		<div class="actions">
			<a class="btn primary" href={samplesHref}>▶ Watch sample lessons</a>
			<a class="btn secondary" href={admissionsHref} target="_blank" rel="noopener">Admissions</a>
		</div>

		<ul class="trust">
			{#each trust as t}
				<li>✓ {t}</li>
			{/each}
		</ul>
	</div>
</section>

<style>
	.hero {
		--navy: #090d1f;
		--amber: #f5b82e;

		background:
			radial-gradient(ellipse at center, rgba(9, 13, 31, 0.75) 0%, rgba(9, 13, 31, 0.1) 75%),
			url("/images/hero.webp") center / cover no-repeat,
			var(--navy);

		color: #fff;
		padding: 6rem 1rem 5rem;
		text-align: center;
		font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
	}

	.inner {
		width: min(100%, 900px);
		margin: 0 auto;
	}

	.tagline {
		margin: 0 0 1.25rem;
		font-size: 1.7rem;
		color: var(--amber);
		letter-spacing: 0.02em;
	}

	h1 {
		margin: 0 0 1rem;
		font-size: clamp(2rem, 4.5vw, 3.2rem);
		line-height: 1.15;
		color: #fff;
	}

	.sub {
		max-width: 680px;
		margin: 0 auto 1rem;
		font-size: 1.2rem;
		line-height: 1.55;
		opacity: 0.9;
	}

	.detail {
		margin: 0 0 2.25rem;
		font-size: 1.05rem;
		letter-spacing: 0.03em;
		opacity: 0.7;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 2.5rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 230px;
		padding: 1rem 1.75rem;
		border-radius: 14px;
		font-size: 1.15rem;
		font-weight: 600;
		text-decoration: none;
		transition: transform 0.15s, background 0.15s, border-color 0.15s;
	}

	.btn:hover {
		transform: translateY(-2px);
	}

	.btn.primary {
		background: var(--amber);
		color: var(--navy);
		border: 2px solid var(--amber);
	}

	.btn.primary:hover {
		background: #ffc94d;
	}

	.btn.secondary {
		background: rgba(255, 255, 255, 0.06);
		color: #fff;
		border: 2px solid rgba(255, 255, 255, 0.35);
	}

	.btn.secondary:hover {
		border-color: var(--amber);
		background: rgba(245, 184, 46, 0.1);
	}

	.trust {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem 2rem;
		font-size: 0.95rem;
		opacity: 0.85;
	}

	.trust li {
		margin: 0;
	}

	@media (max-width: 600px) {
		.hero {
			padding: 4rem 1rem 3.5rem;
		}

		.sub {
			font-size: 1.05rem;
		}

		.btn {
			width: 100%;
		}
	}
</style>