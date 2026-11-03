<script>
	///home/bilal-tariq/00--TALEEM/taleem/src/routes/player/+page.svelte
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { get } from "svelte/store";
	import { send } from "$lib/send";
	import { loadLesson } from "$lib/utils/player-utils";
	import PlayerShell from "$lib/components/playerShell/PlayerShell.svelte";
	import LoadingScreen from "$lib/components/playerShell/LoadingScreen.svelte";
	// import Communication from "$lib/components/Communication.svelte";
	// import Discussion from "$lib/components/Discussion.svelte";

	let lesson = null;
	let progress = null;
	let error = null;

	const lessonSlug = get(page).url.searchParams.get("lesson");

	onMount(() => {
		const controller = new AbortController();
		let loaded = null;

		(async () => {
			try {
				const item = await send("library", "get", { slug: lessonSlug });

				loaded = await loadLesson(JSON.parse(item.body), {
					strict: false,
					signal: controller.signal,
					onProgress: (p) => (progress = p)
				});

				if (controller.signal.aborted) return loaded.destroy();
				lesson = loaded;
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

<!--
{#if lesson}
<div class="lesson-interaction">
	<Communication librarySlug={lessonSlug} type="user-comment" />
	<Discussion librarySlug={lessonSlug} />
</div>
{/if}
-->

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

	/* Re-enable together with Communication / Discussion
	.lesson-interaction {
		width: min(95%, 900px);
		margin: 2rem auto 4rem;
		padding: 1.5rem;
		box-sizing: border-box;
		background: var(--theme-panel);
		color: var(--theme-text);
		border: 1px solid var(--theme-border);
		border-radius: 14px;
	}

	.lesson-interaction :global(textarea) {
		width: 100%;
		box-sizing: border-box;
	}

	.lesson-interaction :global(.communication) {
		margin-top: 0;
	}

	@media (max-width: 600px) {
		.lesson-interaction {
			width: 95%;
			padding: 1rem;
		}
	}
	*/
</style>