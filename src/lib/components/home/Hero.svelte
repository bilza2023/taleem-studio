<!-- src/lib/components/home/Hero.svelte -->
<script>
	const samplesHref = "#samples";
	const admissionsHref = "/admissions";

	// Wide banner for desktop, 16:9 banner for phones (put both in static/images/)
	const bannerWide = "/images/hero.webp";
	const bannerMobile = "/images/hero-mobile.webp";
</script>

<section class="hero">
	<div class="frame">
		<picture>
			<source media="(max-width: 800px)" srcset={bannerMobile} />
			<img
				src={bannerWide}
				alt="Taleem.help — Pakistan's Tuition App. Step 1: subscribe to your book. Step 2: video lessons and more, new content every day. Step 3: ask the teacher. Step 4: your record. 1 book, 1 year subscription. Federal Board Class 8, 9, 10 Math, new curriculum."
				width="3840"
				height="1240"
				fetchpriority="high"
			/>
		</picture>
	</div>

	<div class="actions">
		<a class="btn primary" href={samplesHref}>▶ Watch sample lessons</a>
		<a class="btn secondary" href={admissionsHref}>Admissions</a>
	</div>
</section>


<style>
	.hero {
		--navy: #090d1f;
		--amber: #f5b82e;

		background: #0b1530;
		color: #fff;
		padding: 2rem clamp(1rem, 4vw, 4rem) 3rem;
		font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
	}

	.frame {
		width: min(100%, 1600px);
		margin: 0 auto;
		padding: 3px; /* border thickness */
		border-radius: 22px;
		background: linear-gradient(
			135deg,
			#f7e7b4 0%,
			#d9b45a 22%,
			#f4f6fa 48%,
			#c9a24a 74%,
			#f7e7b4 100%
		);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.08),
			0 0 28px rgba(245, 200, 110, 0.25),
			0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.frame img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 19px; /* 22px − 3px border */
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin-top: 2rem;
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

	@media (max-width: 600px) {
		.hero {
			padding: 1.25rem 0.75rem 2.5rem;
		}

		.frame {
			padding: 2px;
			border-radius: 16px;
		}

		.frame img {
			border-radius: 14px;
		}

		.btn {
			width: 100%;
		}
	}
</style>