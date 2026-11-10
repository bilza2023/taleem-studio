<script>
	// src/lib/editor/Editor.svelte
	// Content only: add / edit / sort / delete slides, background, audio file name.
	// No audio player, no timing controls — timings are the timings page's job.
	import Nav from "./Nav.svelte";
	import Slides from "./slides/Slides.svelte";
	import Settings from "./Settings.svelte";
	import { slideFactory } from "./js/slideFactory.js";
	import { patchDeckV2 } from "./js/patchDeckV2.js";
	import { validateDeckV2 } from "$lib/taleem-specs/validation/validateDeckV2.js";

	export let deck = { deck: [] };
	export let onExport;

	let collapsed = {};
	let currentSlideIndex;
	let allCollapsed = false;

	function toggleCollapseAll() {
		allCollapsed = !allCollapsed;
		collapsed = Object.fromEntries(deck.deck.map((_, i) => [i, allCollapsed]));
	}

	function addSlide(type) {
		const fn = slideFactory[type];
		if (!fn) return;

		const insertAt = deck.deck.length ? currentSlideIndex + 1 : 0;
		const prev = deck.deck[insertAt - 1];

		// Placeholder times — the timings page sets real ones
		const newSlide = {
			...fn(),
			start: prev ? prev.end : 0,
			end: prev ? prev.end : 0
		};

		const arr = [...deck.deck];
		arr.splice(insertAt, 0, newSlide);
		deck.deck = arr;

		const map = {};
		arr.forEach((_, idx) => {
			if (idx < insertAt) map[idx] = collapsed[idx] || false;
			else if (idx === insertAt) map[idx] = false;
			else map[idx] = collapsed[idx - 1] || false;
		});
		collapsed = map;

		currentSlideIndex = insertAt;
	}

	// Content check only (schema). Timings are not checked here.
	function preparePresentation() {
		const patched = patchDeckV2(deck);
		const result = validateDeckV2(patched);

		if (!result.ok) {
			console.error(result);
			const error = result.errors?.[0];
			alert(
				"SCHEMA\n\n" +
					(error?.path ? `${error.path}\n` : "") +
					(error?.message ?? "Unknown error")
			);
			return null;
		}

		return patched;
	}

	function handleDownload() {
		const presentation = preparePresentation();
		if (!presentation) return;

		const blob = new Blob([JSON.stringify(presentation, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = "deck.json";
		a.click();

		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	async function handleSave() {
		const presentation = preparePresentation();
		if (!presentation) return;

		try {
			await onExport(presentation);
			alert("Presentation saved");
		} catch (err) {
			console.error(err);
			alert(err.message);
		}
	}
</script>

<div class="editor">
	<Nav
		add={addSlide}
		onDownload={handleDownload}
		onSave={handleSave}
		onCollapseAll={toggleCollapseAll}
	/>

	<!-- Background + audio file name -->
	<div class="settings-bar">
		<Settings
			bind:background={deck.background}
			audio={deck.audio}
			onUse={(filename) => (deck.audio = filename)}
		/>
	</div>

	<Slides {deck} bind:collapsed bind:currentSlideIndex />
</div>

<style>
	.editor {
		--editor-danger: #ef4444;
		--editor-surface: color-mix(in srgb, var(--theme-panel) 85%, white);
		--editor-surface-hover: color-mix(in srgb, var(--theme-border) 75%, var(--theme-accent));

		width: 100%;
		margin: 0 auto;
		padding: 12px;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		gap: 10px;
		background: var(--theme-panel);
		color: var(--theme-text);
		font-family: system-ui, sans-serif;
	}

	.settings-bar {
		display: flex;
		align-items: center;
		width: 100%;
		gap: 10px;
		flex-wrap: wrap;
	}
</style>