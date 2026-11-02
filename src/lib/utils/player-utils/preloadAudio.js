// /src/lib/utils/player-utils/preloadAudio.js
// Downloads the whole audio file into memory (compressed) and returns a blob URL.
// onProgress(loaded, total) — total is 0 if the server sends no Content-Length.

export async function preloadAudio(url, { signal, onProgress } = {}) {
	const res = await fetch(url, { signal });
	if (!res.ok) throw new Error(`Audio download failed (${res.status}): ${url}`);

	const total = Number(res.headers.get("Content-Length")) || 0;
	const type = res.headers.get("Content-Type") || "audio/ogg";

	// Fallback: no streaming body available
	if (!res.body) {
		const blob = await res.blob();
		onProgress?.(blob.size, blob.size);
		return URL.createObjectURL(blob);
	}

	const reader = res.body.getReader();
	const chunks = [];
	let loaded = 0;
	onProgress?.(0, total);

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
		loaded += value.length;
		onProgress?.(loaded, total);
	}

	return URL.createObjectURL(new Blob(chunks, { type }));
}