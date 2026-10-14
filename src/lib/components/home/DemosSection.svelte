<!-- src/lib/components/home/DemosSection.svelte -->
<script>
	import Section from "./Section.svelte";
	import HomeLinks from "$lib/components/HomeLinks.svelte";

	// image = Library.thumbnail for that slug
	const samples = [
		{ type: "PLAYER", slug: "fbise8math-ch1-real-numbers", title: "Real Numbers", groupSlug: "Class 8 Math", image: "fbise8math.svg" },
		{ type: "PLAYER", slug: "fbise8math-ch1-properties-of-real-numbers", title: "Properties Of Real Numbers", groupSlug: "Class 8 Math", image: "fbise8math.svg" },
		{ type: "PLAYER", slug: "fbise8math-ch1-irrational-numbers", title: "Irrational Numbers", groupSlug: "Class 8 Math", image: "fbise8math.svg" },
		{ type: "PLAYER", slug: "number-line-representation", title: "Number Line Representation", groupSlug: "Class 9 Math", image: "fbise9math.svg" },
		{ type: "ARTICLE", slug: "fbise9math-quickref-ch-8", title: "Quick Reference · Linear Graphs", groupSlug: "Class 9 Math", image: "9math-ch8-quickref-linear-graphs.png" },
		{ type: "ARTICLE", slug: "fbise9math-quickref-ch-9", title: "Quick Reference · Coordinate Geometry", groupSlug: "Class 9 Math", image: "9math-ch9-quickref-introduction-to-coordinate-geometry.png" },
		{ type: "ARTICLE", slug: "fbise9math-quickref-ch-10", title: "Quick Reference · Congruent Triangles", groupSlug: "Class 9 Math", image: "9math-ch10-quickref-congruent-triangles.png" }
	];
</script>

<Section id="samples" title="Samples" subtitle="Watch a real lesson and see how Taleem.help teaches.">
	<HomeLinks homeLinks={samples} />
</Section>