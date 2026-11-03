<script>
	// /src/routes/admin/player/+page.svelte
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { get } from "svelte/store";
	import { send } from "$lib/send";
	import { loadLesson } from "$lib/utils/player-utils";
	import PlayerShell from "$lib/components/playerShell/PlayerShell.svelte";
	import LoadingScreen from "$lib/components/playerShell/LoadingScreen.svelte";

	let lesson = null;
	let progress = null;
	let error = null;

	const lessonSlug = get(page).url.searchParams.get("lesson");
	function trackEvent(name) {
		send("analytics", "track", { name, slug: lessonSlug }, "admin").catch(() => {});
	}
	onMount(() => {
		const controller = new AbortController();
		let loaded = null;

		(async () => {
			try {
				const item = await send("adminLibrary", "get", { slug: lessonSlug });

				loaded = await loadLesson(JSON.parse(item.body), {
					strict: true,
					signal: controller.signal,
					onProgress: (p) => (progress = p)
				});

				if (controller.signal.aborted) return loaded.destroy();
				lesson = loaded;
				trackEvent("lesson.open");//// Analytics
			} catch (e) {
				if (e?.name === "AbortError") return;
				console.error(e);
				error = e?.message ?? String(e);
			}
		})();

		return () => {
			controller.abort();
			loaded?.destroy();
		};
	});
</script>

{#if lesson}
	<PlayerShell deck={lesson.deck} timer={lesson.timer} />
{:else}
	<LoadingScreen {progress} {error} />
{/if}

<style>
	:global(html),
	:global(body) {
		overflow-y: auto !important;
		height: auto !important;
	}

	:global(main) {
		overflow: visible !important;
		height: auto !important;
		min-height: 100vh;
	}

	:global(.player-layout) {
		overflow: visible !important;
		height: auto !important;
		min-height: 100vh;
	}
</style>