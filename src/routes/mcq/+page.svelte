<!-- /home/bilal-tariq/00--TALEEM/taleem/src/routes/mcq/+page.svelte -->
<!-- /home/bilal-tariq/00--TALEEM/taleem/src/routes/mcq/+page.svelte -->
<script>
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { get } from "svelte/store";
	import { send } from "$lib/send";
	import Mcq from "$lib/mcq/Mcq.svelte";
	import LoadingScreen from "$lib/components/playerShell/LoadingScreen.svelte";

	let mcq = $state(null);
	let error = $state(null);
	let saveStatus = $state(null); // null | "saving" | "saved" | "login" | "error"
	let lastReport = null;

	const mcqSlug = get(page).url.searchParams.get("mcq");

	// Show = save: called once when the report card appears.
	// The full report (what the student saw) is saved as meta.
	async function handleFinish(report) {
		lastReport = report;
		saveStatus = "saving";
		try {
			const r = await send(
				"analytics",
				"saveMcqResult",
				{ slug: mcqSlug, meta: report },
				"user"
			);
			saveStatus = r.saved ? "saved" : "login";
		} catch (e) {
			console.error(e);
			saveStatus = "error";
		}
	}

	onMount(() => {
		let cancelled = false;

		(async () => {
			try {
				if (!mcqSlug) throw new Error("No MCQ slug in URL (?mcq=...)");
				const item = await send("library", "get", { slug: mcqSlug });
				const parsed = JSON.parse(item.body);
				if (!cancelled) mcq = parsed;
			} catch (e) {
				console.error(e);
				if (!cancelled) error = e?.message ?? String(e);
			}
		})();

		return () => (cancelled = true);
	});
</script>

{#if mcq}
	<Mcq {mcq} onFinish={handleFinish} />

	{#if saveStatus}
		<p class="save-status">
			{#if saveStatus === "saving"}
				Saving…
			{:else if saveStatus === "saved"}
				Saved ✓
			{:else if saveStatus === "login"}
				Log in to keep your history.
			{:else}
				Couldn't save.
				<button type="button" onclick={() => handleFinish(lastReport)}>Retry</button>
			{/if}
		</p>
	{/if}
{:else}
	<LoadingScreen progress={null} {error} />
{/if}

<style>
	.save-status {
		text-align: center;
		margin: 0.5rem 0 2rem;
	}
	.save-status button {
		width: auto;
		margin-left: 0.5rem;
		padding: 0.3rem 0.9rem;
	}
</style>