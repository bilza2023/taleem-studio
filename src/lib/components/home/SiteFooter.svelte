<!-- src/lib/components/home/SiteFooter.svelte -->
<script>
	const articleUrl = (slug) => `/articles?article=${slug}`;

	const classes = [
		{ label: "Class 8 Math", href: "/courses" },
		{ label: "Class 9 Math", href: "/courses" },
		{ label: "Class 10 Math", href: "/courses" },
		{ label: "All courses", href: "/courses" }
	];

	const learn = [
		{ label: "Animated presentations", href: articleUrl("how-taleem-lessons-work") },
		{ label: "In depth course coverage", href: articleUrl("in-depth-course-coverage") },
		{ label: "Concepts first", href: articleUrl("concepts-first") },
		{ label: "Ask a teacher", href: articleUrl("ask-a-teacher") }
	];

	const account = [
		{ label: "Sign in", href: "/signin" },
		{ label: "Create account", href: "/signup" },
		{ label: "My hub", href: "/hub" }
	];

	const phone = "0333-9724440";
	const whatsapp = "https://wa.me/923339724440";

	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="inner">
		<div class="brand">
			<a class="logo" href="/">Taleem.help</a>
			<p class="tagline">Pakistan's Online Academy</p>
			<p class="about">
				Animated lessons for Pakistani students.<br />
				Classes 8–10 · Federal Board course
			</p>
		</div>

		<nav class="col" aria-label="Classes">
			<h4>Classes</h4>
			<ul>
				{#each classes as l}
					<li><a href={l.href}>{l.label}</a></li>
				{/each}
			</ul>
		</nav>

		<nav class="col" aria-label="How it works">
			<h4>How it works</h4>
			<ul>
				{#each learn as l}
					<li><a href={l.href}>{l.label}</a></li>
				{/each}
			</ul>
		</nav>

		<div class="col">
			<h4>Contact</h4>
			<ul>
				<li><a href={`tel:${phone.replace("-", "")}`}>📞 {phone}</a></li>
				<li><a href={whatsapp} target="_blank" rel="noopener">💬 WhatsApp us</a></li>
				<li class="address">
					📍 River View Junction, in front of Dominion Mall,<br />
					Bahria Town Phase 8, Rawalpindi
				</li>
			</ul>

			<h4 class="sub">Account</h4>
			<ul>
				{#each account as l}
					<li><a href={l.href}>{l.label}</a></li>
				{/each}
			</ul>
		</div>
	</div>

	<div class="bottom">
		<p>© {year} Taleem.help. All rights reserved.</p>
	</div>
</footer>

<style>
	.footer {
		--navy: #090d1f;
		--amber: #f5b82e;

		background: var(--navy);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		color: #dfe6f5;
		font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
		margin-top: 4rem;
	}

	.inner {
		width: min(100%, 1100px);
		margin: 0 auto;
		padding: 3.5rem 1rem 2.5rem;
		display: grid;
		grid-template-columns: 1.4fr 1fr 1fr 1.3fr;
		gap: 2.5rem;
	}

	.logo {
		font-size: 1.5rem;
		font-weight: 700;
		color: #fff;
		text-decoration: none;
	}

	.tagline {
		margin: 0.25rem 0 1rem;
		color: var(--amber);
		font-weight: 600;
	}

	.about {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.6;
		opacity: 0.7;
	}

	h4 {
		margin: 0 0 0.9rem;
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #fff;
	}

	h4.sub {
		margin-top: 1.5rem;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	li {
		margin: 0;
		font-size: 0.92rem;
	}

	a {
		color: #dfe6f5;
		text-decoration: none;
		opacity: 0.8;
		transition: color 0.15s, opacity 0.15s;
	}

	a:hover {
		color: var(--amber);
		opacity: 1;
	}

	.brand a.logo {
		opacity: 1;
	}

	.address {
		line-height: 1.5;
		opacity: 0.8;
	}

	.bottom {
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		padding: 1.25rem 1rem;
		text-align: center;
	}

	.bottom p {
		margin: 0;
		font-size: 0.85rem;
		opacity: 0.55;
	}

	@media (max-width: 860px) {
		.inner {
			grid-template-columns: 1fr 1fr;
		}

		.brand {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 520px) {
		.inner {
			grid-template-columns: 1fr;
			gap: 2rem;
			padding-top: 2.5rem;
		}
	}
</style>