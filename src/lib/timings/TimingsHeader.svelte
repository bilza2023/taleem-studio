<!-- src/lib/timings/TimingsHeader.svelte -->
<!-- Green identity bar: lesson info, links, deck/save/publish buttons. Display only. -->
<script>
	import { config } from "$lib/config.js";

	let {
		item,
		canDeck = false,
		canSave = false,
		canPublish = false,
		onDownloadDeck,
		onSave,
		onPublish
	} = $props();

	const enc = encodeURIComponent;
	const editorHref = $derived(
		`${config.basePath}/admin/edit/editor?course=${enc(item.courseSlug)}&group=${enc(item.groupSlug)}&slug=${enc(item.slug)}`
	);
	const playHref = $derived(`${config.basePath}/admin/player?lesson=${enc(item.slug)}`);

	// Buttons drop focus so ↑ ↓ Enter always reach the page
	const click = (fn) => (e) => {
		e.currentTarget.blur();
		fn?.();
	};
</script>

<div class="identity">
	<div><strong>Slug:</strong> {item.slug}</div>
	<div><strong>Course:</strong> {item.courseSlug}</div>
	<div><strong>Group:</strong> {item.groupSlug}</div>

	<a class="back" href={editorHref}>Editor</a>
	<a class="back" href={playHref}>Play</a>

	<button class="back" disabled={!canDeck} onclick={click(onDownloadDeck)}>⬇ Deck</button>
	<button class="back save" disabled={!canSave} onclick={click(onSave)}>💾 Save</button>
	<button class="back publish" disabled={!canPublish} onclick={click(onPublish)}>🚀 Publish</button>
</div>

<style>
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
		color: aliceblue;
	}

	.back {
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
	}

	a.back {
		margin-left: 0;
		text-decoration: none;
		transition: background 0.15s ease, transform 0.1s ease;
	}

	a.back:first-of-type {
		margin-left: auto;
	}

	a.back:hover {
		background: #145229;
		transform: translateY(-1px);
	}

	button.back {
		width: auto;
		margin: 0;
		cursor: pointer;
	}

	button.save {
		color: #86efac;
	}

	button.publish {
		color: #fbbf24;
		border-color: #b45309;
	}

	button.back:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>