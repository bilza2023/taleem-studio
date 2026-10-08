<!-- src/lib/components/home/Hero.svelte -->
<script>
	const classes = [
		{ name: "FBISE Class 8 Math", note: "", href: "/courses" },
		{ name: "FBISE Class 9 Math", note: "", href: "/courses" },
		{ name: "FBISE Class 10 Math", note: "", href: "/courses" }
	];

	const trust = ["Online, anywhere in Pakistan", "Complete FBISE syllabus", "Indepth course coverage"];
</script>

<section class="hero">
	<div class="inner">
		<p class="tagline">Taleem.help - Pakistan's Online Academy</p>

		<h1>Animated lessons for Pakistani students.</h1>

		<p class="detail">Classes 8–10 · Federal Board course</p>

		<p class="ask">Which class are you in?</p>

		<div class="classes">
			{#each classes as c}
				<a class="class-btn" href={c.href}>
					<strong>{c.name}</strong>
					<span>{c.note}</span>
				</a>
			{/each}
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
		radial-gradient(ellipse at center, rgba(9, 13, 31, 0.88) 0%, rgba(9, 13, 31, 0.6) 75%),
		url("images/hero.webp") center / cover no-repeat,
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
		margin: 0 0 0.75rem;
		font-size: clamp(2rem, 4.5vw, 3.2rem);
		line-height: 1.15;
		color: #fff;
	}

	.detail {
		margin: 0 0 2.5rem;
		font-size: 1.05rem;
		letter-spacing: 0.03em;
		opacity: 0.7;
	}

	.ask {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		opacity: 0.85;
	}

	.classes {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 2.5rem;
	}

	.class-btn {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1.25rem 1rem;
		border-radius: 14px;
		background: rgba(255, 255, 255, 0.06);
		border: 2px solid rgba(255, 255, 255, 0.15);
		color: #fff;
		text-decoration: none;
		transition: border-color 0.15s, background 0.15s, transform 0.15s;
	}

	.class-btn:hover {
		border-color: var(--amber);
		background: rgba(245, 184, 46, 0.1);
		transform: translateY(-2px);
	}

	.class-btn strong {
		font-size: 1.4rem;
	}

	.class-btn span {
		font-size: 0.9rem;
		opacity: 0.75;
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

		.classes {
			grid-template-columns: 1fr;
		}
	}
</style>