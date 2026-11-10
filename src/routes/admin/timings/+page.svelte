<!-- src/routes/admin/timings/+page.svelte -->
<script>
	import { onMount, onDestroy } from "svelte";
	import { page } from "$app/state";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";
	import { patchDeckV2 } from "$lib/editor/js/patchDeckV2.js";
	import { finalizeDeckV2 } from "$lib/editor/js/finalizeDeckV2.js";
	import { buildTapList } from "$lib/timings/buildTapList.js";
	import { mergeTimings } from "$lib/timings/mergeTimings.js";
	import { createRecorder } from "$lib/timings/recorder.js";
	import { createAudioClock } from "$lib/timings/audioClock.js";
	import TimingsList from "$lib/timings/TimingsList.svelte";
	import RecordBar from "$lib/timings/RecordBar.svelte";

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
			if (!slug) throw new Error("No slug in URL (?slug=...)");

			const data = await send("adminLibrary", "get", { slug });
			if (!data) throw new Error(`"${slug}" not found`);
			if (data.type !== "PLAYER") throw new Error(`"${slug}" is a ${data.type}, not a Player.`);
			if (!data.body?.trim()) throw new Error(`"${slug}" has no deck yet — build it in the Editor first.`);

			const patched = patchDeckV2(JSON.parse(data.body));
			if (!patched.deck.length) throw new Error(`"${slug}" has no slides.`);

			item = data;
			original = patched;
			deck = patched;
			if (!patched.audio) source = "file";
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
		// If the admin header stays on screen (fixed/sticky), pin our bars just below it
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
	let blob = null;
	let audioSaved = false; // recorded audio downloaded or published
	let raf = 0;

	const lastMark = $derived(marks.length ? marks[marks.length - 1] : null);

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

	function saveFile(data, name, type) {
		const a = document.createElement("a");
		a.href = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
		a.download = name;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 1000);
	}

	function download() {
		if (!blob) return;
		saveFile(blob, `${slug}.webm`);
		audioSaved = true;
	}

	function downloadDeck() {
		if (merged) saveFile(JSON.stringify(merged, null, 2), `${slug}.json`, "application/json");
	}

	// Timings only: body-only update. audio is left exactly as it is in the deck.
	async function save() {
		if (!merged) return;

		// Same gate as the Editor
		const r = finalizeDeckV2(merged);
		if (!r.ok) {
			const err = r.errors?.[0];
			saveStatus = "error";
			note = `Not saved — ${r.stage}: ${err?.path ? `${err.path} — ` : ""}${err?.message ?? "invalid deck"}`;
			return;
		}

		saveStatus = "saving";
		note = "Saving…";

		try {
			await send("adminLibrary", "update", {
				slug,
				data: { body: JSON.stringify(r.presentation) }
			});
		} catch (err) {
			console.error(err);
			saveStatus = "error";
			note = `Not saved — ${err?.message ?? err}`;
			return;
		}

		// Reload: the saved deck becomes the new original (grey times = saved times)
		original = r.presentation;
		deck = r.presentation;
		merged = null;
		marks = [];
		cursor = 0;
		dropClock();
		status = "idle";
		saveStatus = "saved";
		note = `Saved ✓${blob && !audioSaved ? " · audio not downloaded yet (⬇ Audio)" : ""}`;
	}

	// Publish = audio to server (→ .opus + Audio row), then save the deck with audio = <slug>.opus
	async function publish() {
		if (!merged || !blob) return;

		saveStatus = "saving";
		note = "Publishing audio…";

		const form = new FormData();
		form.append("slug", slug);
		form.append("audio", blob, `${slug}.webm`);

		const token = localStorage.getItem("taleem-admin-token");
		let out;
		try {
			const res = await fetch(`${config.basePath}/admin/timings/publish`, {
				method: "POST",
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				body: form
			});
			out = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(out.error ?? `HTTP ${res.status}`);
		} catch (err) {
			console.error(err);
			saveStatus = "error";
			note = `Audio not published — ${err?.message ?? err}`;
			return;
		}

		// Audio file now exists → safe to point the deck at it
		audioSaved = true;
		merged = { ...merged, audio: out.audio };

		await save();

		if (saveStatus === "saved") {
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
			<div class="identity">
				<div><strong>Slug:</strong> {item.slug}</div>
				<div><strong>Course:</strong> {item.courseSlug}</div>
				<div><strong>Group:</strong> {item.groupSlug}</div>
				<a
					class="back"
					href={`${config.basePath}/admin/edit/editor?course=${encodeURIComponent(item.courseSlug)}&group=${encodeURIComponent(item.groupSlug)}&slug=${encodeURIComponent(item.slug)}`}
				>
					Editor
				</a>
				<a
					class="back"
					href={`${config.basePath}/admin/player?lesson=${encodeURIComponent(item.slug)}`}
				>
					Play
				</a>
				<button class="back" disabled={!merged} onclick={downloadDeck}>⬇ Deck</button>
				<button class="back save" disabled={!merged || saveStatus === "saving"} onclick={save}>💾 Save</button>
				<button
					class="back publish"
					disabled={!merged || !blob || saveStatus === "saving"}
					onclick={publish}
				>
					🚀 Publish
				</button>
			</div>

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
					onDownload={download}
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

	.identity {
		margin-bottom: 10px;
		padding: 12px;
		background: #01310d;
		border: 1px solid #333;
		border-radius: 6px;
		display: flex;
		align-items: center;
		gap: 20px;
		font-size: 0.9rem;
	}

	.identity a.back {
		margin-left: 0;
		display: inline-flex;
		align-items: center;
		padding: 6px 14px;
		border-radius: 6px;
		border: 1px solid #3a5a4a;
		background: #0d3d1c;
		color: #5fa8ff;
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 600;
		line-height: 1;
		transition: background 0.15s ease, transform 0.1s ease;
	}

	.identity a.back:first-of-type {
		margin-left: auto;
	}

	.identity a.back:hover {
		background: #145229;
		transform: translateY(-1px);
	}

	.identity button.back {
		width: auto;
		margin: 0;
		display: inline-flex;
		align-items: center;
		padding: 6px 14px;
		border-radius: 6px;
		border: 1px solid #3a5a4a;
		background: #0d3d1c;
		color: #5fa8ff;
		font-size: 0.85rem;
		font-weight: 600;
		line-height: 1;
		cursor: pointer;
	}

	.identity button.save {
		color: #86efac;
	}

	.identity button.publish {
		color: #fbbf24;
		border-color: #b45309;
	}

	.identity button.back:disabled {
		opacity: 0.4;
		cursor: not-allowed;
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