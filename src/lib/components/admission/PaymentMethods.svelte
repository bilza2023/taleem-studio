<!-- src/lib/components/admissions/PaymentMethods.svelte -->
<script>
	let {
		number = "0333-9724440",
		accountName = "", // Easypaisa account title, shown once set
		amount = "Rs 5,000",
		coursesHref = "#courses",
		questionsHref = "" // e.g. a plain wa.me link, shown once set
	} = $props();

	let copied = $state(false);

	async function copyNumber() {
		try {
			await navigator.clipboard.writeText(number.replaceAll("-", ""));
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// clipboard blocked: the number is still visible to copy by hand
		}
	}
</script>

<section class="admission">
	<h2>Admission</h2>

	<ol class="steps">
		<li class="step">
			<span class="num">1</span>
			<div class="body">
				<h3>Pay through Easypaisa</h3>

				<div class="account">
					<span class="number">{number}</span>
					<button type="button" class="copy" onclick={copyNumber}>
						{copied ? "Copied ✓" : "Copy"}
					</button>
				</div>

				{#if accountName}
					<p class="meta">Account title: <strong>{accountName}</strong></p>
				{/if}

				<p class="meta">Amount: <strong>{amount}</strong> per class, for 1 year</p>
				<p class="hint">JazzCash or bank? Send to the same Easypaisa number.</p>
			</div>
		</li>

<li class="step">
	<span class="num">2</span>
	<div class="body">
		<h3>Send the receipt on WhatsApp</h3>
		<p>
			Click the button on <strong>your class card below</strong> (Class 8, 9 or 10).
			WhatsApp opens with your class already written.
		</p>
		<p>Attach the Easypaisa screenshot and press send.</p>
		<a class="jump" href={coursesHref}>↓ Choose your class</a>
	</div>
</li>
	</ol>

	{#if questionsHref}
		<p class="questions">
			Questions before paying? <a href={questionsHref} target="_blank" rel="noopener">Message us</a>
		</p>
	{/if}
</section>

<style>
	.admission {
		--amber: #f5b82e;
		margin-bottom: 3rem;
	}

	h2 {
		margin: 0 0 1.25rem;
	}

	.steps {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1rem;
	}

	.step {
		display: flex;
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--theme-border);
		border-radius: 12px;
	}

	.num {
		flex: none;
		width: 2.25rem;
		height: 2.25rem;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--amber);
		color: #090d1f;
		font-weight: 700;
	}

	.body h3 {
		margin: 0.2rem 0 0.6rem;
		font-size: 1.1rem;
	}

	.body p {
		margin: 0 0 0.4rem;
	}

	.account {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.6rem;
	}

	.number {
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		color: var(--amber);
	}

	.copy {
		width: auto;
		margin: 0;
		padding: 0.3rem 0.8rem;
		font-size: 0.85rem;
		background: transparent;
		color: inherit;
		border: 1px solid var(--theme-border);
		border-radius: 999px;
		cursor: pointer;
	}

	.copy:hover {
		border-color: var(--amber);
	}

	.meta {
		font-size: 0.95rem;
	}

	.hint {
		font-size: 0.85rem;
		opacity: 0.75;
	}

	.body a,
	.questions a {
		color: var(--amber);
	}

	.questions {
		margin: 1rem 0 0;
		font-size: 0.9rem;
		opacity: 0.85;
	}
</style>