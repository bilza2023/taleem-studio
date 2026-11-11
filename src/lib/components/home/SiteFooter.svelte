<!-- src/lib/components/home/SiteFooter.svelte -->
<script>
	const articleUrl = (slug) => `/articles?article=${slug}`;

	const courses = [
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

	const start = [
		{ label: "Sample lessons", href: "/#samples" },
		{ label: "Admissions", href: "/admission" },
		{ label: "Sign in", href: "/signin" },
		{ label: "Create account", href: "/signup" },
		{ label: "My hub", href: "/hub" }
	];

	const phone = "0333-9724440";
	const whatsapp = "https://wa.me/923339724440";
	const mapUrl =
		"https://www.google.com/maps/search/?api=1&query=Dominion+Mall+Bahria+Town+Phase+8+Rawalpindi";

	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="inner">
		<div class="brand">
			<a class="logo" href="/">📘 Taleem.help</a>
			<p class="tagline">Pakistan's Online Academy</p>
			<p class="about">
				Video courses for Federal Board students.<br />
				One course for each book, question by question.
			</p>

			<a class="wa-btn" href={whatsapp} target="_blank" rel="noopener">
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill="currentColor"
						d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"
					/>
				</svg>
				<span>
					<strong>WhatsApp us</strong>
					<small>{phone} · chat only</small>
				</span>
			</a>

			<a class="address" href={mapUrl} target="_blank" rel="noopener">
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill="currentColor"
						d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z"
					/>
				</svg>
				<span>
					River View Junction, in front of Dominion Mall,<br />
					Bahria Town Phase 8, Rawalpindi
				</span>
			</a>
		</div>

		<nav class="col" aria-label="Courses">
			<h4>Courses</h4>
			<ul>
				{#each courses as l}
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

		<nav class="col" aria-label="Get started">
			<h4>Get started</h4>
			<ul>
				{#each start as l}
					<li><a href={l.href}>{l.label}</a></li>
				{/each}
			</ul>
		</nav>
	</div>

	<div class="bottom">
		<p>© {year} Taleem.help. All rights reserved.</p>
		<p>Federal Board · Classes 8–10</p>
	</div>
</footer>

<style>
	.footer {
		--navy: #090d1f;
		--amber: #f5b82e;
		--text: #dfe6f5;

		background: var(--navy);
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		color: var(--text);
		margin-top: 4rem;
	}

	.inner {
		width: min(100%, 1150px);
		margin: 0 auto;
		padding: 3.5rem 1.25rem 2.5rem;
		display: grid;
		grid-template-columns: 1.6fr 1fr 1fr 1fr;
		gap: 2.5rem;
	}

	/* ---------- brand column ---------- */
	.logo {
		font-size: 1.5rem;
		font-weight: 700;
		color: #fff;
		text-decoration: none;
	}

	.tagline {
		margin: 0.3rem 0 0.9rem;
		color: var(--amber);
		font-weight: 600;
	}

	.about {
		margin: 0 0 1.4rem;
		font-size: 0.9rem;
		line-height: 1.6;
		opacity: 0.65;
	}

	.wa-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.65rem 1.1rem;
		border-radius: 12px;
		border: 1px solid rgba(37, 211, 102, 0.45);
		background: rgba(37, 211, 102, 0.08);
		color: #fff;
		text-decoration: none;
		transition: background 0.2s, border-color 0.2s, transform 0.2s;
	}
	.wa-btn:hover {
		background: rgba(37, 211, 102, 0.16);
		border-color: #25d366;
		transform: translateY(-1px);
	}
	.wa-btn svg {
		width: 26px;
		height: 26px;
		color: #25d366;
		flex-shrink: 0;
	}
	.wa-btn span {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}
	.wa-btn strong {
		font-size: 0.95rem;
	}
	.wa-btn small {
		font-size: 0.78rem;
		opacity: 0.65;
	}

	.address {
		display: flex;
		gap: 0.6rem;
		margin-top: 1.2rem;
		font-size: 0.86rem;
		line-height: 1.55;
		color: var(--text);
		text-decoration: none;
		opacity: 0.7;
		transition: opacity 0.15s, color 0.15s;
	}
	.address:hover {
		opacity: 1;
		color: var(--amber);
	}
	.address svg {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
		margin-top: 0.15rem;
		color: var(--amber);
	}

	/* ---------- link columns ---------- */
	h4 {
		margin: 0.4rem 0 1rem;
		font-size: 0.78rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.95);
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	li a {
		font-size: 0.92rem;
		color: var(--text);
		text-decoration: none;
		opacity: 0.72;
		transition: color 0.15s, opacity 0.15s;
	}
	li a:hover {
		color: var(--amber);
		opacity: 1;
	}

	/* ---------- bottom bar ---------- */
	.bottom {
		width: min(100%, 1150px);
		margin: 0 auto;
		padding: 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	.bottom p {
		margin: 0;
		font-size: 0.82rem;
		opacity: 0.5;
	}

	/* ---------- responsive ---------- */
	@media (max-width: 860px) {
		.inner {
			grid-template-columns: repeat(3, 1fr);
		}
		.brand {
			grid-column: 1 / -1;
		}
	}

	@media (max-width: 520px) {
		.inner {
			grid-template-columns: 1fr 1fr;
			gap: 2rem 1.5rem;
			padding-top: 2.5rem;
		}
		.col:last-child {
			grid-column: 1 / -1;
		}
		.bottom {
			justify-content: center;
			text-align: center;
		}
	}
</style>