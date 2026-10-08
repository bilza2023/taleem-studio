<!-- src/lib/components/home/ClassesSection.svelte -->
<script>
	import Section from "./Section.svelte";
	import CourseLinks from "$lib/components/CourseLinks.svelte";

	// slug  → from the card's link on /courses   (…/lessons?course=<slug>)
	// image → from the card's image on /courses  (…/content/images/<image>)
	const courses = [
		{
			slug: "fbise8math",
			title: "Class 8 Math",
			description: "Build strong foundations for board classes.",
			image: "fbise8math.svg",
			access: "open"
		},
		{
			slug: "fbise9math",
			title: "Class 9 Math",
			description: "First board year — master the concepts.",
			image: "fbise9math.svg",
			access: "open"
		},
		{
			slug: "fbise10math",
			title: "Class 10 Math",
			description: "Strengthen concepts and get exam-ready.",
			image: "fbise10math.svg",
			access: "open"
		}
	];
</script>

<Section
	id="classes"
	title="Choose Your Class"
	subtitle="Federal Board Mathematics, taught concept by concept."
>
	<CourseLinks homeLinks={courses} />
</Section>