<!-- src/routes/admin/timings/+page.svelte -->
<script>
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";
	import { patchDeckV2 } from "$lib/editor/js/patchDeckV2.js";
		import { buildTapList } from "$lib/timings/buildTapList.js";
	import TimingsList from "$lib/timings/TimingsList.svelte";

	const slug = page.url.searchParams.get("slug");

	let item = $state.raw(null);
	let deck = $state.raw(null); // plain object: safe for structuredClone in mergeTimings
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
			deck = patched;
			message = "";
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	});

	// Temporary check: what the tap list looks like for this deck
	const list = $derived(deck ? buildTapList(deck) : []);
	let cursor = $state(0);

	// Browsing: ↑ ↓ move the highlight
	function onKey(e) {
		if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
		const tag = e.target?.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
		if (!list.length) return;

		e.preventDefault();
		cursor =
			e.key === "ArrowDown"
				? Math.min(cursor + 1, list.length - 1)
				: Math.max(cursor - 1, 0);
	}
</script>
<svelte:window onkeydown={onKey} />
<div class="page">
	{#if message}
		<p class="message">{message}</p>
	{:else}
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
		</div>

			<div class="body">
			<TimingsList {deck} {list} {cursor} onPick={(k) => (cursor = k)} />
		</div>
	{/if}
</div>

<style>

	.body {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 1rem;
	}
	.page {
		width: 100%;
		color: aliceblue;
		font-family: system-ui, sans-serif;
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

	.message {
		max-width: 800px;
		margin: 40px auto;
		padding: 12px;
		background: #eee;
		color: #222;
		border-radius: 5px;
	}

	
</style>