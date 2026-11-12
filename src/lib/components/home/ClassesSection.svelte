<!-- src/lib/components/home/ClassesSection.svelte -->
<script>
	import CourseLinks from "$lib/components/home/CourseLinks.svelte";
	import { courses } from "$lib/components/home/courses.js";

	
</script>

<section id="classes" class="classes">
	<div class="inner">
		<!-- <header class="head">
			<span class="eyebrow">Admissions open</span>
			<h2>Choose your course</h2>
			<p class="sub">
				Full-year access for <strong>Rs 8,000</strong>
				<span class="dot">•</span> or Rs 5,000 for 6 months
			</p>
		</header> -->

		<CourseLinks homeLinks={courses} />
	</div>
</section>

<style>
	.classes {
		padding: 1.25rem 1rem 3.5rem;
		font-family: "Poppins", "Segoe UI", system-ui, -apple-system, sans-serif;
		color: #e8edf8;
	}

	.inner {
		width: min(100%, 1400px);
		margin: 0 auto;
	}

	.head {
		text-align: center;
		margin-bottom: 0.25rem;
	}

	.eyebrow {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border: 1px solid rgba(245, 185, 50, 0.5);
		border-radius: 999px;
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #f5b932;
		background: rgba(245, 185, 50, 0.08);
	}

	.head h2 {
		margin: 0.5rem 0 0.25rem;
		font-family: inherit;
		font-size: clamp(1.5rem, 2.6vw, 2rem);
		font-weight: 700;
		color: #fff;
	}

	.sub {
		margin: 0;
		font-size: 0.95rem;
		color: #aab6d3;
	}

	.sub strong {
		color: #f5b932;
	}

	.dot {
		margin: 0 0.35rem;
		opacity: 0.5;
	}

	@media (max-width: 600px) {
		.classes {
			padding: 1rem 0.5rem 2.5rem;
		}
	}
</style>