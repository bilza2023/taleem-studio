// src/lib/timings/recorder.js
// Mic → webm/opus. Clock counts only recorded time (pauses excluded).

export function createRecorder() {
	let mr = null;
	let stream = null;
	let chunks = [];
	let startedAt = 0;
	let acc = 0;
	let state = "idle"; // idle | recording | paused | stopped

	function now() {
		return state === "recording" ? acc + (performance.now() - startedAt) / 1000 : acc;
	}

	function release() {
		stream?.getTracks().forEach((t) => t.stop());
		stream = null;
	}

	async function start() {
		stream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
		});

		const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
			? "audio/webm;codecs=opus"
			: "";

		mr = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
		chunks = [];
		mr.ondataavailable = (e) => {
			if (e.data.size) chunks.push(e.data);
		};

		// Resolve when recording really begins: the clock starts here, not on click.
		await new Promise((resolve, reject) => {
			mr.onstart = () => {
				startedAt = performance.now();
				acc = 0;
				state = "recording";
				resolve();
			};
			mr.onerror = (e) => reject(e.error ?? e);
			mr.start(1000);
		});
	}

	function pause() {
		if (state !== "recording") return;
		acc = now();
		mr.pause();
		state = "paused";
	}

	function resume() {
		if (state !== "paused") return;
		mr.resume();
		startedAt = performance.now();
		state = "recording";
	}

	// → { blob, duration } (null if nothing was recording)
	function stop() {
		return new Promise((resolve) => {
			if (state !== "recording" && state !== "paused") return resolve(null);
			const duration = now();
			acc = duration;
			state = "stopped";
			mr.onstop = () => {
				release();
				resolve({ blob: new Blob(chunks, { type: mr.mimeType || "audio/webm" }), duration });
			};
			mr.stop();
		});
	}

	function reset() {
		if (mr && mr.state !== "inactive") {
			mr.onstop = null;
			mr.stop();
		}
		release();
		mr = null;
		chunks = [];
		acc = 0;
		state = "idle";
	}

	return { start, pause, resume, stop, reset, now };
}