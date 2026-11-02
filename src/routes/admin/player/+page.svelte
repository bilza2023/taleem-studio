<script>
	// /src/routes/admin/player/+page.svelte
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import { get } from "svelte/store";
	import { send } from "$lib/send";
	import { Howl } from "howler";
	import { config } from "$lib/config.js";
	import { getAudioFileName, resolveAssetPaths, getTimer } from "$lib/utils/player-utils";
	import PlayerShell from "$lib/components/playerShell/PlayerShell.svelte";

	let presentation = null;
	let timer = null;

	const lessonSlug = get(page).url.searchParams.get("lesson");

	onMount(async () => {
		try {
			const item = await send("adminLibrary", "get", { slug: lessonSlug });
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