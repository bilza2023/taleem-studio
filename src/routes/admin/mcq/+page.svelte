<!-- /src/routes/admin/mcq/+page.svelte -->
<script>
	import Mcq from "$lib/mcq/Mcq.svelte";
	import mcq from "$lib/mcq/golden-mcq.json";

	// Nothing is saved yet — just log the report so we can see it.
	function handleFinish(report) {
		console.log("MCQ finished", report);
	}
</script>

<Mcq {mcq} onFinish={handleFinish} />