<!-- src/lib/components/home/FaqSection.svelte -->
<script>
	import Section from "./Section.svelte";

	// TODO: review answers
	const faqs = [
		{ q: "What is Taleem.help?", a: "Pakistan's online academy for FBISE Classes 8, 9 and 10, teaching through step-by-step animated lessons with teacher support." },
		{ q: "Do you follow the FBISE syllabus?", a: "Yes. Every course follows the Federal Board syllabus chapter by chapter." },
		{ q: "Can students outside Rawalpindi/Islamabad join?", a: "Yes. Everything is online, so students anywhere in Pakistan can join." },
		{ q: "Is there an in-person option?", a: "Yes, we also have a centre in Bahria Town Phase 8, Rawalpindi, at River View Junction in front of Dominion Mall." },
		{ q: "How do students ask questions?", a: "Every lesson has a question and discussion area where teachers respond." },
		{ q: "Can I try before enrolling?", a: "Yes. Watch any demo lesson on this page, or message us on WhatsApp for a free trial." },
		{ q: "How do I enrol?", a: "Message us on WhatsApp at 0333-9724440 and we'll guide you through it." }
	];
</script>

<Section id="faq" title="Questions Parents Ask">
	<div class="list">
		{#each faqs as item}
			<details>
				<summary>{item.q}</summary>
				<p>{item.a}</p>
			</details>
		{/each}
	</div>
</Section>

<style>
	.list {
		max-width: 800px;
	}

	details {
		border-bottom: 1px solid var(--theme-border, #e3e6ee);
		padding: 0.25rem 0;
	}

	summary {
		font-weight: 600;
		cursor: pointer;
	}

	details p {
		margin: 0.25rem 0 1rem;
		opacity: 0.8;
	}
</style>