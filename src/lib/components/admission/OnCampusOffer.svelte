<script>
	import EnrollButton from "./EnrollButton.svelte";

	let { offer, courses = [] } = $props();
</script>

{#if offer?.enabled}
	<section class="offer">
		<div class="head">
			<h2>{offer.title}</h2>
			<div class="badges">
				<span class="badge tag">{offer.tag}</span>
				<span class="badge seats">{offer.seatsText}</span>
			</div>
		</div>

		<ul>
			{#each offer.points as point}
				<li>{point}</li>
			{/each}
		</ul>

		<div class="buttons">
			{#each courses as course}
				<EnrollButton
					courseTitle={course.title}
					mode="On-campus"
					label={`${course.title} — on campus`}
					variant="secondary"
				/>
			{/each}
		</div>
	</section>
{/if}

<style>
	.offer {
		padding: 1.5rem;
		border: 1px dashed color-mix(in srgb, #E8791A 60%, transparent);
		border-radius: 14px;
		background: color-mix(in srgb, #E8791A 7%, transparent);
		color: var(--theme-text);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.badges {
		display: flex;
		gap: 0.5rem;
	}

	.badge {
		padding: 2px 10px;
		border-radius: 999px;
		font-size: 0.8rem;
		font-weight: 600;
	}

	.tag {
		border: 1px solid var(--theme-border);
	}

	.seats {
		color: #E8791A;
		border: 1px solid color-mix(in srgb, #E8791A 55%, transparent);
		background: color-mix(in srgb, #E8791A 12%, transparent);
	}

	ul {
		margin: 1rem 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.4rem;
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
</style>