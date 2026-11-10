<!-- src/lib/timings/RecordBar.svelte -->
<!-- Toolbar: display + buttons only. All logic lives in the page. -->
<script>
	let {
		mode = "record", // record | sync
		status = "idle", // idle | starting | recording | paused | stopped
		source = "deck", // sync source: deck | file
		deckAudio = null,
		fileName = null,
		canStart = true,
		elapsed = 0,
		marked = 0,
		total = 0,
		lastMark = null,
		note = "",
		canDownload = false, // recorded audio available
		saveStatus = null, // null | saving | saved | error
		onMode,
		onSource,
		onPickFile,
		onStart,
		onPause,
		onResume,
		onStop,
		onReset,
		onDownload,
	} = $props();

	function fmt(t) {
		const m = Math.floor(t / 60);
		const s = (t % 60).toFixed(1).padStart(4, "0");
		return `${m}:${s}`;
	}

	// Controls drop focus so ↑ ↓ Enter always reach the page
	const click = (fn) => (e) => {
		e.currentTarget.blur();
		fn?.();
	};

	const sync = $derived(mode === "sync");
</script>

<div class="bar">
	{#if status === "idle"}
		<div class="mode">
			<button class:active={!sync} onclick={click(() => onMode?.("record"))}>🎙 Record new</button>
			<button class:active={sync} onclick={click(() => onMode?.("sync"))}>🎧 Sync to audio</button>
		</div>

		{#if sync}
			<div class="source">
				<select
					value={source}
					onchange={(e) => {
						onSource?.(e.currentTarget.value);
						e.currentTarget.blur();
					}}
				>
					<option value="deck" disabled={!deckAudio}>
						Deck audio{deckAudio ? `: ${deckAudio}` : " (none)"}
					</option>
					<option value="file">{fileName ? `File: ${fileName}` : "File from computer…"}</option>
				</select>

				{#if source === "file"}
					<input
						type="file"
						accept="audio/*,.opus,.webm"
						onchange={(e) => {
							onPickFile?.(e.currentTarget.files?.[0] ?? null);
							e.currentTarget.blur();
						}}
					/>
				{/if}
			</div>
		{/if}
	{/if}

	<div class="clock">
		<span class="dot" class:on={status === "recording"} class:sync class:paused={status === "paused"}></span>
		<span class="time">{fmt(elapsed)}</span>
	</div>

	<div class="info">
		<span>Marked <b class="count">{marked}</b> / {total}</span>
		<span>Last {lastMark === null ? "–" : fmt(lastMark)}</span>
	</div>

	<div class="buttons">
		{#if status === "idle"}
			<button class="start" disabled={!canStart} onclick={click(onStart)}>
				{sync ? "▶ Play & mark" : "● Record"}
			</button>
		{:else if status === "starting"}
			<button disabled>Starting…</button>
		{:else if status === "recording"}
			<button onclick={click(onPause)}>❚❚ Pause</button>
			<button onclick={click(onStop)}>■ Stop</button>
		{:else if status === "paused"}
			<button onclick={click(onResume)}>▶ Resume</button>
			<button onclick={click(onStop)}>■ Stop</button>
		{/if}

		{#if canDownload}
			<button onclick={click(onDownload)}>⬇ Audio</button>
		{/if}


		{#if status !== "idle" && status !== "starting"}
			<button class="reset" onclick={click(onReset)}>Reset</button>
		{/if}
	</div>

	<div class="hint" class:ok={saveStatus === "saved"} class:bad={saveStatus === "error"}>
		{#if status === "recording"}
						{#if marked >= total}
				Last row marked — ↓ / Enter again = Stop
			{:else}
				↓ / Enter = mark next · ↑ = undo{sync ? " (audio jumps back)" : ""} · click a marked row = go back
			{/if}
			
		{:else if status === "paused"}
			Paused — keys off
		{:else if note}
			{note}
		{:else if status === "idle"}
			↑ ↓ browse · {sync ? "Play starts the audio from 0 at row 1" : "Record starts at row 1"}
		{/if}
	</div>
</div>

<style>
	.bar {
		flex: 0 0 auto;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem 1.25rem;
		padding: 0.6rem 1rem;
		margin-bottom: 0.5rem;
		background: #111827;
		border: 1px solid #374151;
		border-radius: 8px;
	}

	.mode,
	.source {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.mode button,
	.buttons button {
		width: auto;
		margin: 0;
		padding: 0.4rem 0.9rem;
		border-radius: 6px;
		border: 1px solid #4b5563;
		background: #1f2937;
		color: #e5e7eb;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.mode button.active {
		border-color: #4f8cff;
		background: #4f8cff22;
	}

	select,
	input[type="file"] {
		width: auto;
		margin: 0;
		padding: 0.3rem 0.5rem;
		font-size: 0.8rem;
		background: #1f2937;
		color: #e5e7eb;
		border: 1px solid #4b5563;
		border-radius: 6px;
	}

	.clock {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.time {
		font-family: ui-monospace, monospace;
		font-size: 1.3rem;
		min-width: 6ch;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #4b5563;
	}

	.dot.on {
		background: #ef4444;
		animation: pulse 1s infinite;
	}

	.dot.on.sync {
		background: #22c55e;
	}

	.dot.paused {
		background: #f59e0b;
		animation: none;
	}

	@keyframes pulse {
		50% { opacity: 0.3; }
	}

	.info {
		display: flex;
		gap: 1rem;
		font-size: 0.85rem;
		color: #9ca3af;
	}

	.info b {
		color: #e5e7eb;
	}

	.info .count {
		color: #facc15;
	}

	.buttons {
		display: flex;
		gap: 0.5rem;
		margin-left: auto;
	}

	.buttons button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.buttons .start {
		border-color: #ef4444;
		color: #fca5a5;
	}

	.buttons .reset {
		color: #9ca3af;
	}

	.hint {
		flex-basis: 100%;
		font-size: 0.78rem;
		color: #6b7280;
	}

	.hint.ok {
		color: #86efac;
	}

	.hint.bad {
		color: #fca5a5;
	}
</style>