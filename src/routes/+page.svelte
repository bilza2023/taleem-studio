<svelte:head>
	<title>Taleem.help — Pakistan's Online Academy</title>
	<meta name="description" content="Online FBISE classes 8, 9 and 10 with step-by-step lessons and teacher support." />
</svelte:head>

<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import DemosSection from "$lib/components/home/DemosSection.svelte";
	import WhyTaleemSection from "$lib/components/home/WhyTaleemSection.svelte";

	import SiteFooter from "$lib/components/home/SiteFooter.svelte";
import HeroCarousel from "$lib/components/home/HeroCarousel.svelte";
   const heroSlides = [
        { src: "/hero/1.png", alt: "What is Taleem.help" },
        { src: "/hero/2.png", alt: "Class 8 Math" },
        { src: "/hero/3.png", alt: "Class 9 Math" },
        { src: "/hero/4.png", alt: "Class 10 Math" },
        { src: "/hero/5.png", alt: "Ask the Teacher" }
    ];
	let samples = [];

	onMount(async () => {
		try {
			const items = await send("library", "listByTag", { tag: "pinned", courseSlug: "blog" });

			samples = items.map((item) => ({
				type: item.type,
				slug: item.slug,
				title: item.title,
				groupSlug: item.groupSlug,
				image: item.thumbnail
			}));
			
			console.log("samples" ,samples);

		} catch (error) {
			console.error(error);
		}
	});
</script>


<HeroCarousel slides={heroSlides} />

<div class="hero-cta">
    <a href="#samples" class="btn primary">▶ Watch sample lessons</a>
    <a href="/admissions" class="btn secondary">Admissions</a>
</div>
<!-- <Hero /> -->
<DemosSection {samples} />
<!-- <ClassesSection /> -->
<WhyTaleemSection />
<!-- <FeesSection /> -->
<!-- <FaqSection /> -->

<SiteFooter />


<style>
	.hero-cta {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1rem 1rem 3rem;
}
.btn {
    padding: 0.9rem 2.2rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1.1rem;
    text-decoration: none;
    transition: transform 0.2s, box-shadow 0.2s;
}
.btn:hover { transform: translateY(-2px); }
.btn.primary {
    background: #f5b82e;
    color: #0b1530;
    box-shadow: 0 8px 24px rgba(245, 184, 46, 0.3);
}
.btn.secondary {
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #fff;
}
</style>