<!-- src/lib/components/home/FeesSection.svelte -->
<script>
	import Section from "./Section.svelte";

	const whatsapp = "https://wa.me/923339724440";

	// TODO: real fees, or keep "Ask us" if not public
	const plans = [
		{ name: "Single Subject", price: "Rs —", period: "/month", features: ["One subject", "All lessons", "Teacher Q&A"] },
		{ name: "Science Pack", price: "Rs —", period: "/month", features: ["Maths + 3 sciences", "All lessons", "Teacher Q&A", "Revision support"], featured: true },
		{ name: "Full Class", price: "Rs —", period: "/month", features: ["All subjects", "All lessons", "Teacher Q&A", "Progress check-ins"] }
	];
</script>

<Section id="fees" alt title="Fees & Enrolment" subtitle="Simple monthly plans. Start with a free demo lesson.">
	<div class="grid">
		{#each plans as plan}
			<div class="plan" class:featured={plan.featured}>
				{#if plan.featured}<span class="badge">Most popular</span>{/if}
				<h3>{plan.name}</h3>
				<p class="price">{plan.price}<span>{plan.period}</span></p>
				<ul>
					{#each plan.features as f}
						<li>✓ {f}</li>
					{/each}
				</ul>
				<a class="btn" href={whatsapp} target="_blank" rel="noopener">Enrol via WhatsApp</a>
			</div>
		{/each}
	</div>
</Section>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.25rem;
		align-items: stretch;
	}

	.plan {
		position: relative;
		display: flex;
		flex-direction: column;
		padding: 1.75rem 1.5rem;
		border: 1px solid var(--theme-border, #e3e6ee);
		border-radius: 14px;
		background: var(--theme-panel, #fff);
	}

	.plan.featured {
		border: 2px solid var(--theme-accent, #f5b82e);
	}

	.badge {
		position: absolute;
		top: -0.75rem;
		left: 1.5rem;
		padding: 0.15rem 0.7rem;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
		background: #f5b82e;
		color: #0f1b3d;
	}

	h3 {
		margin: 0 0 0.5rem;
	}

	.price {
		margin: 0 0 1rem;
		font-size: 2rem;
		font-weight: 700;
	}

	.price span {
		font-size: 0.95rem;
		font-weight: 400;
		opacity: 0.7;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem;
	}

	li {
		margin: 0 0 0.4rem;
	}

	.btn {
		margin-top: auto;
		text-align: center;
		padding: 0.75rem;
		border-radius: 10px;
		font-weight: 600;
		text-decoration: none;
		background: #0f1b3d;
		color: #fff;
	}
</style>