<!-- src/lib/components/home/WhyTaleemSection.svelte -->
<script>
	import Section from "./Section.svelte";

	const articleUrl = (slug) => `/articles?article=${slug}`;

	const points = [
		{
			icon: "🎬",
			title: "Animated presentations",
			text: "Every exercise question gets its own short animated presentation, about 5 minutes long.",
			slug: "how-taleem-lessons-work"
		},
		{
			icon: "📚",
			title: "In depth course coverage",
			text: "Every question in the course is covered, and every step of every solution is explained.",
			slug: "in-depth-course-coverage"
		},
		{
			icon: "🧩",
			title: "Concepts first",
			text: "Each topic starts with introduction presentations that build the idea before the questions.",
			slug: "concepts-first"
		},
		{
			icon: "🙋",
			title: "Ask a teacher",
			text: "Ask a question under any lesson and a teacher answers. Available on selected accounts.",
			slug: "ask-a-teacher"
		}
	];
</script>

<Section id="why" title="What is Taleem.help?" subtitle="An online academy designed around understanding.">
	<div class="grid">
		{#each points as p}
			<a class="point" href={articleUrl(p.slug)}>
				<span class="icon">{p.icon}</span>
				<h3>{p.title}</h3>
				<p>{p.text}</p>
				<span class="more">Read more →</span>
			</a>
		{/each}
	</div>
</Section>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: 1.5rem;
	}

	.point {
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		border-left: 4px solid var(--theme-accent, #f5b82e);
		background: var(--theme-panel, #fafbfd);
		border-radius: 0 12px 12px 0;
		color: inherit;
		text-decoration: none;
		transition: transform 0.15s, background 0.15s;
	}

	.point:hover {
		transform: translateY(-3px);
	}

	.icon {
		font-size: 1.8rem;
	}

	h3 {
		margin: 0.6rem 0 0.4rem;
		font-size: 1.15rem;
	}

	p {
		margin: 0 0 1rem;
		opacity: 0.8;
	}

	.more {
		margin-top: auto;
		font-weight: 600;
		color: var(--theme-accent, #f5b82e);
	}
</style>