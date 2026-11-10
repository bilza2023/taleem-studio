<!-- src/routes/admin/timings/+page.svelte -->
<!-- Coordinates: state, keys, recording/sync clock, merge. Everything else is in $lib/timings. -->
<script>
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/state";
	import { buildTapList } from "$lib/timings/buildTapList.js";
	import { mergeTimings } from "$lib/timings/mergeTimings.js";
	import { createRecorder } from "$lib/timings/recorder.js";
	import { createAudioClock } from "$lib/timings/audioClock.js";
	import { loadDeck } from "$lib/timings/loadDeck.js";
	import { saveDeck } from "$lib/timings/saveDeck.js";
	import { publishAudio } from "$lib/timings/publishAudio.js";
	import { downloadFile } from "$lib/timings/downloadFile.js";
	import TimingsHeader from "$lib/timings/TimingsHeader.svelte";
	import RecordBar from "$lib/timings/RecordBar.svelte";
	import TimingsList from "$lib/timings/TimingsList.svelte";

	const AUDIO_BASE = "/content/audio/";
	const slug = page.url.searchParams.get("slug");

	/* ───────────── Load ───────────── */

	let item = $state.raw(null);
	let original = $state.raw(null); // last loaded / saved deck — merges start from this
	let deck = $state.raw(null); // what the list shows: original, or merged after Stop
	let merged = $state.raw(null); // deck with new timings (after a good Stop), else null
	let message = $state("Loading...");

	onMount(async () => {
		try {
			const loaded = await loadDeck(slug);
			item = loaded.item;
			original = loaded.deck;
			deck = loaded.deck;
			if (!loaded.deck.audio) source = "file";
			message = "";
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	});

	// One row per timed item
	const list = $derived(deck ? buildTapList(deck) : []);
	const last = $derived(list.length - 1);

	/* ───────────── Layout: page scroll; bars pinned under the admin header ───────────── */

	let stickyTop = $state(0);

	onMount(() => {
		const header = [...document.querySelectorAll("header, nav")].find((el) =>
			["fixed", "sticky"].includes(getComputedStyle(el).position)
		);
		stickyTop = header ? Math.round(header.getBoundingClientRect().bottom) : 0;
	});

	/* ───────────── Mode & source ───────────── */

	let mode = $state("record"); // record | sync
	let source = $state("deck"); // sync source: deck | file
	let syncFile = $state.raw(null);

	const canStart = $derived(
		mode === "record" || (source === "deck" ? !!original?.audio : !!syncFile)
	);

	function setMode(m) {
		if (status !== "idle") return;
		mode = m;
		note = "";
	}

	/* ───────────── Clock state ───────────── */

	let clock = null; // recorder (record) or audio clock (sync)

	let cursor = $state(0);
	let status = $state("idle"); // idle | starting | recording | paused | stopped
	let marks = $state([]); // marks[k] = time of row k; cursor + 1 long while running
	let elapsed = $state(0);
	let note = $state("");
	let canDownload = $state(false);
	let saveStatus = $state(null); // null | saving | saved | error
	let blob = $state.raw(null);
	let audioSaved = false; // recorded audio downloaded or published
	let raf = 0;

	const lastMark = $derived(marks.length ? marks[marks.length - 1] : null);
	const busy = $derived(saveStatus === "saving");

	function tick() {
		elapsed = clock?.now() ?? 0;
		if (status === "recording") raf = requestAnimationFrame(tick);
	}

	function dropClock() {
		clock?.reset();
		clock?.destroy?.();
		clock = null;
	}

	async function start() {
		note = "";
		status = "starting";
		dropClock();

		try {
			if (mode === "record") {
				clock = createRecorder();
			} else {
				const src = source === "deck" ? AUDIO_BASE + original.audio : syncFile;
				clock = createAudioClock(src);
				clock.onEnded(() => {
					if (status === "recording") stop();
				});
			}
			await clock.start();
		} catch (err) {
			dropClock();
			status = "idle";
			note =
				mode === "record"
					? `Microphone not available: ${err?.message ?? err}`
					: `${err?.message ?? err}`;
			return;
		}

		// Start = row 1 at 0.0
		deck = original;
		merged = null;
		saveStatus = null;
		marks = [0];
		cursor = 0;
		canDownload = false;
		blob = null;
		audioSaved = false;
		status = "recording";
		tick();
	}

	function pause() {
		clock.pause();
		status = "paused";
		cancelAnimationFrame(raf);
		elapsed = clock.now();
	}

	function resume() {
		clock.resume();
		status = "recording";
		tick();
	}

	// Stop = stop. Nothing is downloaded or saved here.
	async function stop() {
		cancelAnimationFrame(raf);
		status = "stopped"; // first: no marks while the clock finishes

		const out = await clock.stop();
		if (!out) return;

		elapsed = out.duration;

		if (mode === "record") {
			blob = out.blob;
			canDownload = true;
		}

		// Add timings to the deck (in memory — Save / Publish writes it)
		const res = mergeTimings(original, $state.snapshot(marks).slice(1), out.duration);
		if (res.ok) {
			merged = res.deck;
			deck = res.deck;
			note = "Timings added — not saved yet";
		} else {
			merged = null;
			note = `Can't add timings: ${res.error} — mark every row before Stop`;
		}
	}

	function reset() {
		cancelAnimationFrame(raf);
		dropClock();
		status = "idle";
		marks = [];
		elapsed = 0;
		blob = null;
		audioSaved = false;
		canDownload = false;
		merged = null;
		saveStatus = null;
		note = "";
		deck = original;
		cursor = 0;
	}

	/* ───────────── Output (only on button click) ───────────── */

	function downloadAudio() {
		if (!blob) return;
		downloadFile(blob, `${slug}.webm`);
		audioSaved = true;
	}

	function downloadDeck() {
		if (merged) downloadFile(JSON.stringify(merged, null, 2), `${slug}.json`, "application/json");
	}

	// Timings only. Returns true when saved.
	async function save() {
		if (!merged) return false;

		saveStatus = "saving";
		note = "Saving…";

		let saved;
		try {
			saved = await saveDeck(slug, merged);
		} catch (err) {
			console.error(err);
			saveStatus = "error";
			note = `Not saved — ${err?.message ?? err}`;
			return false;
		}

		// Reload: the saved deck becomes the new original (grey times = saved times)
		original = saved;
		deck = saved;
		merged = null;
		marks = [];
		cursor = 0;
		dropClock();
		status = "idle";
		saveStatus = "saved";
		note = `Saved ✓${blob && !audioSaved ? " · audio not downloaded yet (⬇ Audio)" : ""}`;
		return true;
	}

	// Audio to server first; only then save the deck with audio = <slug>.opus
	async function publish() {
		if (!merged || !blob) return;

		saveStatus = "saving";
		note = "Publishing audio…";

		let out;
		try {
			out = await publishAudio(slug, blob);
		} catch (err) {
			console.error(err);
			saveStatus = "error";
			note = `Audio not published — ${err?.message ?? err}`;
			return;
		}

		audioSaved = true;
		merged = { ...merged, audio: out.audio };

		if (await save()) {
			note = `Published ✓ — ${out.audio} (${out.sizeMb} MB${out.created ? ", new Audio row" : ""}) · deck saved`;
		} else {
			note = `Audio published (${out.audio}), but the deck was not saved — ${note}`;
		}
	}

	/* ───────────── Marking ───────────── */

	// Sync mode only: move the audio back to the current row's mark
	function rewind() {
		if (mode === "sync") {
			clock?.seek(marks[cursor] ?? 0);
			elapsed = clock?.now() ?? elapsed;
		}
	}

	function mark() {
		if (cursor >= last) return;
		marks = [...marks, Math.round(clock.now() * 1000) / 1000];
		cursor += 1;
	}

	function undo() {
		if (cursor <= 0) return; // row 1 stays at 0
		marks = marks.slice(0, cursor);
		cursor -= 1;
		rewind();
	}

	// Click a marked row k: unmark k and everything after, continue from there
	function goBack(k) {
		if (k < 1 || k > cursor) return;
		marks = marks.slice(0, k);
		cursor = k - 1;
		rewind();
	}

	function onPick(k) {
		if (status === "recording") {
			if (k === cursor + 1) mark();
			else goBack(k);
			return;
		}
		if (status === "idle" || status === "stopped") cursor = k;
	}

	/* ───────────── Keys ───────────── */

	function onKey(e) {
		const tag = e.target?.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
		if (!list.length) return;

		const down = e.key === "ArrowDown";
		const up = e.key === "ArrowUp";
		const enter = e.key === "Enter";

		if (status === "recording") {
			if (!down && !up && !enter) return;
			e.preventDefault();
			if (e.repeat) return;
			if (up) undo();
			else mark();
			return;
		}

		if (status === "paused" || status === "starting") {
			if (down || up || enter) e.preventDefault();
			return;
		}

		// idle / stopped: browse
		if (!down && !up) return;
		e.preventDefault();
		cursor = down ? Math.min(cursor + 1, last) : Math.max(cursor - 1, 0);
	}

	// Ask before leaving: running, unsaved timings, or audio not downloaded / published
	function onBeforeUnload(e) {
		if (status === "recording" || status === "paused" || merged || (blob && !audioSaved)) {
			e.preventDefault();
		}
	}

	onDestroy(() => {
		cancelAnimationFrame(raf);
		dropClock();
	});
</script>

<svelte:window onkeydown={onKey} onbeforeunload={onBeforeUnload} />

<div class="page">
	{#if message}
		<p class="message">{message}</p>
	{:else}
		<!-- Pinned: identity bar + record bar -->
		<div class="head" style={`top:${stickyTop}px`}>
			<TimingsHeader
				{item}
				canDeck={!!merged}
				canSave={!!merged && !busy}
				canPublish={!!merged && !!blob && !busy}
				onDownloadDeck={downloadDeck}
				onSave={save}
				onPublish={publish}
			/>

			<div class="body">
				<RecordBar
					{mode}
					{status}
					{source}
					deckAudio={original?.audio ?? null}
					fileName={syncFile?.name ?? null}
					{canStart}
					{elapsed}
					marked={marks.length}
					total={list.length}
					{lastMark}
					{note}
					{canDownload}
					{saveStatus}
					onMode={setMode}
					onSource={(s) => (source = s)}
					onPickFile={(f) => (syncFile = f)}
					onStart={start}
					onPause={pause}
					onResume={resume}
					onStop={stop}
					onReset={reset}
					onDownload={downloadAudio}
				/>
			</div>
		</div>

		<!-- Scrolls with the page -->
		<div class="body">
			<TimingsList {deck} {list} {cursor} {marks} {onPick} />
		</div>
	{/if}
</div>

<style>
	.page {
		width: 100%;
		color: aliceblue;
		font-family: system-ui, sans-serif;
	}

	.head {
		position: sticky;
		z-index: 40;
		background: #0f1a33; /* opaque, so the list scrolls underneath it */
		padding-bottom: 2px;
	}

	.body {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 1rem;
		box-sizing: border-box;
	}

	.message {
		max-width: 800px;
		margin: 40px auto;
		padding: 12px;
		background: #eee;
		color: #222;
		border-radius: 5px;
	}
</style>