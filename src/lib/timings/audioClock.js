// src/lib/timings/audioClock.js
// Same interface as recorder.js, but the clock is an existing audio file's playback.
// source: a URL string (deck audio) or a File/Blob (picked from disk)

export function createAudioClock(source) {
	const own = typeof source !== "string";
	const url = own ? URL.createObjectURL(source) : source;
	const audio = new Audio(url);
	audio.preload = "auto";

	let state = "idle"; // idle | recording (= playing) | paused | stopped

	function now() {
		return audio.currentTime;
	}

	async function start() {
		audio.currentTime = 0;
		try {
			await audio.play();
		} catch (err) {
			throw new Error(`Can't play ${own ? source.name ?? "file" : url}: ${err?.message ?? err}`);
		}
		state = "recording";
	}

	function pause() {
		if (state !== "recording") return;
		audio.pause();
		state = "paused";
	}

	function resume() {
		if (state !== "paused") return;
		audio.play();
		state = "recording";
	}

	function seek(t) {
		audio.currentTime = Math.max(0, t);
	}

	// → { blob: null, duration }  — duration = full file length when known
	async function stop() {
		if (state !== "recording" && state !== "paused") return null;
		const at = audio.currentTime;
		audio.pause();
		state = "stopped";
		const d = audio.duration;
		return { blob: null, duration: Number.isFinite(d) && d > at ? d : at };
	}

	function reset() {
		audio.pause();
		state = "idle";
	}

	function onEnded(fn) {
		audio.onended = fn;
	}

	function destroy() {
		audio.pause();
		audio.onended = null;
		audio.removeAttribute("src");
		audio.load();
		if (own) URL.revokeObjectURL(url);
	}

	return { start, pause, resume, stop, reset, now, seek, onEnded, destroy };
}