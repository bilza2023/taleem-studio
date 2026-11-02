<script>
	// /src/routes/player/+page.svelte
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { get } from "svelte/store";
	import { send } from "$lib/send";
	import { Howl } from "howler";
	import { config } from "$lib/config.js";
	import { getAudioFileName, resolveAssetPaths, getTimer } from "$lib/utils/player-utils";
	import PlayerShell from "$lib/components/playerShell/PlayerShell.svelte";
	// import Communication from "$lib/components/Communication.svelte";
	// import Discussion from "$lib/components/Discussion.svelte";

	let presentation = null;
	let timer = null;

	const lessonSlug = get(page).url.searchParams.get("lesson");

	onMount(async () => {
		try {
			const item = await send("library", "get", { slug: lessonSlug });
			const deck = JSON.parse(item.body);

			resolveAssetPaths(deck, `${config.basePath}/content/images/`);

			timer = await getTimer(getAudioFileName(deck), Howl);
			presentation = deck;
		} catch (error) {
			console.error(error);
		}
	});
</script>

{#if presentation && timer}
	<PlayerShell deck={presentation} {timer} />
{/if}

<!--
{#if presentation}
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