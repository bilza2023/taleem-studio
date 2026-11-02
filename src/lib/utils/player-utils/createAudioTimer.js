// /src/lib/utils/player-utils/createAudioTimer.js
// Resolves once Howler has loaded the (local blob) audio.

export function createAudioTimer({ url, Howl, format }) {
	return new Promise((resolve, reject) => {

		const sound = new Howl({
			src: [url],
			html5: true,
			format: format ? [format] : undefined, // blob: URLs have no extension
			onload: () => resolve(timer),
			onloaderror: (_, err) => {
				sound.unload();
				reject(new Error(`Audio failed to load: ${err}`));
			}
		});

		const timer = {
			play() {
				sound.play();
			},
			pause() {
				sound.pause();
			},
			seek(t) {
				sound.seek(t);
			},
			now() {
				const position = sound.seek();
				return typeof position === "number" ? position : 0;
			},
			destroy() {
				sound.unload();
			}
		};
	});
}