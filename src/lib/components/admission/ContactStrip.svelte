<script>
	let { whatsappNumber, phoneDisplay, address, hours } = $props();
</script>

<section class="contact">
	<div class="item">
		<span class="label">WhatsApp</span>
		<a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
			{phoneDisplay}
		</a>
	</div>

	<div class="item">
		<span class="label">Call</span>
		<a href={`tel:+${whatsappNumber}`}>{phoneDisplay}</a>
	</div>

	<div class="item">
		<span class="label">Campus</span>
		<span>{address}</span>
	</div>

	{#if hours}
		<div class="item">
			<span class="label">Replies</span>
			<span>{hours}</span>
		</div>
	{/if}
</section>

<style>
	.contact {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		padding: 1.25rem;
		border: 1px solid var(--theme-border);
		border-radius: 14px;
	}

	.item {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.95rem;
	}

	.label {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.65;
	}

	a {
		color: var(--theme-accent);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}
</style>