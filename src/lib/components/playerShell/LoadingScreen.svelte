<script>
	// /src/lib/components/playerShell/LoadingScreen.svelte
	// Lesson cover shown while loadLesson runs.
	// Same 16:9 frame and position as the player, so nothing jumps when it swaps in.
	// Colours come from the site theme (--theme-*), since the deck's theme isn't loaded yet.

	import { Tween } from "svelte/motion";

	let { progress = null, error = null, title = "" } = $props();

	const AUDIO_WEIGHT = 0.8; // audio is most of the bytes

	const hasAudio = $derived(
		!!(progress?.audio.total || progress?.audio.loaded)
	);

	const audioFraction = $derived(
		progress?.audio.total
			? Math.min(1, progress.audio.loaded / progress.audio.total)
			: 0
	);

	const imageFraction = $derived(
		progress?.images.total
			? progress.images.done / progress.images.total
			: 1
	);

	const percent = $derived(
		!progress
			? 0
			: hasAudio
				? (audioFraction * AUDIO_WEIGHT + imageFraction * (1 - AUDIO_WEIGHT)) * 100
				: imageFraction * 100
	);

	const stage = $derived(
		!progress
			? "Preparing lesson"
			: hasAudio && audioFraction < 1
				? "Downloading narration"
				: imageFraction < 1
					? "Loading diagrams"
					: "Starting"
	);

	// number glides instead of jumping
	const shown = new Tween(0, { duration: 400 });
	$effect(() => {
		shown.target = percent;
	});
</script>

<div class="frame" class:hasError={!!error}>

	<p class="brand">Taleem.help</p>

	<div class="center">
		{#if title}
			<p class="title">{title}</p>
		{/if}

		{#if error}
			<p class="errorHead">Couldn't load this lesson</p>
			<p class="errorDetail">{error}</p>
		{:else}
			<p class="pct">{Math.round(shown.current)}<span class="sign">%</span></p>

			<div class="meter">
				<div class="fill" style={`width:${shown.current}%`}></div>
			</div>

			<p class="stage">{stage}<span class="dots"></span></p>
		{/if}
	</div>

	<div class="track">
		<div class="bar" style={`width:${error ? 100 : shown.current}%`}></div>
	</div>
</div>

<style>
	/* Same size rule as getPlayerSize (controls = 52px), in pure CSS
	   so it renders on first paint — no JS, no 0×0 frame. */
	.frame {
		--bg: var(--theme-panel, #111);
		--fg: var(--theme-text, #f1efe8);
		--line: var(--theme-border, #2c2c2a);
		--accent: var(--theme-accent, var(--theme-primary, #1d9e75));
		--muted: color-mix(in srgb, var(--fg) 55%, transparent);
		--danger: #e24b4a;

		position: relative;
		width: min(100vw, calc((100vh - 52px) * 16 / 9));
		aspect-ratio: 16 / 9;
		margin: 0 auto;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		color: var(--fg);
		border-bottom: 1px solid var(--line);
		overflow: hidden;
		text-align: center;
	}

	p {
		margin: 0;
	}

	/* ---- brand, top-left like a watermark ---- */
	.brand {
		position: absolute;
		top: 4%;
		left: 3%;
		font-size: clamp(11px, 1.1vw, 14px);
		font-weight: 500;
		letter-spacing: 0.04em;
		color: var(--muted);
	}

	/* ---- centre block ---- */
	.center {
		width: min(70%, 520px);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.title {
		margin-bottom: 1.4em;
		font-size: clamp(16px, 2.4vw, 28px);
		font-weight: 500;
		line-height: 1.3;
	}

	.pct {
		font-size: clamp(30px, 5vw, 60px);
		font-weight: 300;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.sign {
		margin-left: 0.08em;
		font-size: 0.45em;
		color: var(--muted);
		vertical-align: 0.9em;
	}

	.meter {
		width: min(100%, 260px);
		height: 4px;
		margin-top: 1.1em;
		border-radius: 999px;
		background: color-mix(in srgb, var(--fg) 12%, transparent);
		overflow: hidden;
	}

	.fill {
		height: 100%;
		border-radius: 999px;
		background: var(--accent);
	}

	.stage {
		margin-top: 0.9em;
		font-size: clamp(12px, 1.2vw, 15px);
		color: var(--muted);
	}

	/* animated ellipsis: "Loading diagrams…" */
	.dots::after {
		content: "";
		display: inline-block;
		width: 1.2em;
		text-align: left;
		animation: dots 1.4s steps(4, end) infinite;
	}

	@keyframes dots {
		0%   { content: ""; }
		25%  { content: "."; }
		50%  { content: ".."; }
		75%  { content: "..."; }
	}

	/* ---- error ---- */
	.errorHead {
		font-size: clamp(16px, 2vw, 24px);
		font-weight: 500;
		color: var(--danger);
	}

	.errorDetail {
		margin-top: 0.7em;
		font-size: clamp(11px, 1.1vw, 14px);
		color: var(--muted);
		white-space: pre-line;
		word-break: break-word;
	}

	/* ---- thin bar at the bottom, where the seek bar will be ---- */
	.track {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 3px;
		background: color-mix(in srgb, var(--fg) 8%, transparent);
	}

	.bar {
		height: 100%;
		background: var(--accent);
	}

	.hasError .bar {
		background: var(--danger);
	}

	@media (prefers-reduced-motion: reduce) {
		.dots::after {
			animation: none;
			content: "…";
		}
	}
</style>