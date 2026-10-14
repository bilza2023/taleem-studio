<script>
	import CourseCard from "$lib/components/admission/CourseCard.svelte";
	import PaymentMethods from "$lib/components/admission/PaymentMethods.svelte";
	import FaqList from "$lib/components/admission/FaqList.svelte";
	import ContactStrip from "$lib/components/admission/ContactStrip.svelte";

	import {
		courses,
		paymentMethods,
		faqs,
		WHATSAPP_NUMBER,
		PHONE_DISPLAY,
		CAMPUS_ADDRESS,
		REPLY_HOURS
	} from "$lib/admission.js";
</script>

<svelte:head>
	<title>Admissions · Taleem.help</title>
	<meta
		name="description"
		content="Admissions open for Class 8, 9 and 10 Math, Federal Board new curriculum. One year per course."
	/>
</svelte:head>

<main class="admission">

	<PaymentMethods methods={paymentMethods} />

	<section class="courses">
		{#each courses as course (course.slug)}
			<CourseCard {course} />
		{/each}
	</section>

	<FaqList items={faqs} />

	<ContactStrip
		whatsappNumber={WHATSAPP_NUMBER}
		phoneDisplay={PHONE_DISPLAY}
		address={CAMPUS_ADDRESS}
		hours={REPLY_HOURS}
	/>
</main>

<style>
	.admission {
		width: min(95vw, 1100px);
		margin: 0 auto;
		padding: 2.5rem 1rem 4rem;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 3rem;
		color: var(--theme-text);
		font-family: inherit;
	}

	.intro h1 {
		margin: 0;
		font-size: 2.4rem;
	}

	.intro p {
		margin: 0.5rem 0 0;
		opacity: 0.8;
	}

	.courses {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.25rem;
	}

	@media (max-width: 600px) {
		.admission {
			padding: 1.5rem 1rem 3rem;
			gap: 2rem;
		}

		.intro h1 {
			font-size: 1.9rem;
		}
	}
</style>