<script>
	// /src/lib/components/playerShell/PlayerShell.svelte
	// TaleemUI + toolbar + sync.
	// Receives a ready deck and timer — knows nothing about where they came from.

	import { onMount } from "svelte";
	import TaleemUI from "$lib/taleemUI/TaleemUI.svelte";
	import { getPlayerSize } from "$lib/utils/player-utils";

	let { deck, timer } = $props();

	let currentTime = $state(0);
	let isPlaying = $state(false);
	let PLAYER_WIDTH = $state(0);
	let PLAYER_HEIGHT = $state(0);

	const deckEndTime = $derived(
		deck?.deck?.[deck.deck.length - 1]?.end || 0
	);

	let ticker = null;

	function play() {
		if (isPlaying) return;
		timer?.play();
		isPlaying = true;
	}

	function pause() {
		timer?.pause();
		isPlaying = false;
	}

	function stop() {
		timer?.pause();
		timer?.seek(0);
		currentTime = 0;
		isPlaying = false;
	}

	function seek(time) {
		timer?.seek(time);
		currentTime = time;
	}

	function togglePlay() {
		if (isPlaying) pause();
		else play();
	}

	function startTicker() {
		if (ticker) return;

		ticker = setInterval(() => {
			if (!timer || !isPlaying) return;

			currentTime = timer.now();

			if (currentTime >= deckEndTime) {
				pause();
				currentTime = deckEndTime - 0.001;
			}
		}, 50);
	}

	function stopTicker() {
		if (ticker) {
			clearInterval(ticker);
			ticker = null;
		}
	}

	async function toggleFullscreen() {
		if (!document.fullscreenElement) {
			await document.documentElement.requestFullscreen();
		} else {
			await document.exitFullscreen();
		}
	}

	function handleKeydown(e) {
		if (e.code !== "Space") return;

		const tag = document.activeElement?.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA") return;

		e.preventDefault();
		togglePlay();
	}

	function resizePlayer() {
		const size = getPlayerSize();
		PLAYER_WIDTH = size.width;
		PLAYER_HEIGHT = size.height;
	}

	onMount(() => {
		resizePlayer();
		startTicker();

		window.addEventListener("resize", resizePlayer);
		window.addEventListener("keydown", handleKeydown);

		return () => {
			window.removeEventListener("resize", resizePlayer);
			window.removeEventListener("keydown", handleKeydown);
			stopTicker();
			timer?.pause();
		};
	});
</script>

{#if PLAYER_WIDTH > 0}
<div class="player" style={`width:${PLAYER_WIDTH}px`}>

	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="viewer" onclick={togglePlay}>
		{#key `${PLAYER_WIDTH}x${PLAYER_HEIGHT}`}
			<TaleemUI
				theme={deck.theme || "default"}
				{deck}
				{currentTime}
				width={PLAYER_WIDTH}
				height={PLAYER_HEIGHT}
			/>
		{/key}
	</div>

	<div class="controls">
		<button onclick={play}>▶</button>
		<button onclick={pause}>⏸</button>
		<button onclick={stop}>⏹</button>

		<span class="time">
			{currentTime.toFixed(1)} / {deckEndTime}s
		</span>

		<input
			type="range"
			min="0"
			max={deckEndTime}
			step="0.1"
			value={currentTime}
			oninput={(e) => seek(parseFloat(e.target.value))}
		/>

		<button onclick={toggleFullscreen} title="Fullscreen">⛶</button>
	</div>

</div>
{/if}

<style>
	.player {
		width: fit-content;
		margin: 0 auto;
	}

	.viewer {
		width: 100%;
		height: auto;
	}

	.controls {
		width: 100%;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		background: #1b1b1b;
		color: #fff;
	}

	.controls button {
		width: 34px;
		height: 34px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: 6px;
		background: #333;
		color: #fff;
		cursor: pointer;
		font-size: 18px;
		line-height: 1;
	}

	.controls button:hover {
		background: #555;
	}

	.time {
		min-width: 80px;
		font-family: monospace;
	}

	.controls input[type="range"] {
		flex: 1;
	}
</style>