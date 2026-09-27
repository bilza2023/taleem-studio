<script>
///home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/narration/+page.svelte

	import { page } from "$app/state";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	let item = $state(null);
	let message = $state("Loading...");
	let loading = $state(true);

	const course = page.url.searchParams.get("course") ?? "";
	const group = page.url.searchParams.get("group") ?? "";
	const slug = page.url.searchParams.get("slug") ?? "";

	let narration = $derived(item?.narration?.trim() ?? "");

	// ## heading   > instruction   plain = spoken
	let blocks = $derived(
		narration
			.split("\n")
			.map((l) => l.trim())
			.filter(Boolean)
			.map((l) =>
				l.startsWith("## ")
					? { kind: "heading", text: l.slice(3) }
					: l.startsWith(">")
						? { kind: "cue", text: l.replace(/^>\s*/, "") }
						: { kind: "spoken", text: l }
			)
	);

	// count only what is actually read aloud
	let wordCount = $derived(
		blocks
			.filter((b) => b.kind === "spoken")
			.reduce((n, b) => n + b.text.split(/\s+/).length, 0)
	);

	// rough speaking pace ~130 words per minute
	let speakingMinutes = $derived(Math.max(1, Math.round(wordCount / 130)));

	async function load() {
		try {
			if (!slug) throw new Error("Slug is required");
			const data = await send("adminLibrary", "get", { slug });
			if (!data) throw new Error(`"${slug}" not found`);
			item = data;
			message = "";
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		load();
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page">
	{#if loading}
		<p>{message}</p>
	{:else if message}
		<p class="message">{message}</p>
	{:else}
		<div class="links">
			<a
				class="editor-link"
				href={`${config.basePath}/admin/edit/content?course=${encodeURIComponent(course)}&group=${encodeURIComponent(group)}&slug=${encodeURIComponent(slug)}`}
			>
				✏️ Edit
			</a>
		</div>

		<header>
			<h1>{item.title || item.slug}</h1>
			<div class="meta">
				<span>{item.courseSlug} / {item.groupSlug} / {item.slug}</span>
				{#if narration}
					<span>{wordCount} spoken words · ~{speakingMinutes} min</span>
				{/if}
			</div>
			<div class="legend">
				<span class="lg spoken-lg">Read aloud</span>
				<span class="lg cue-lg">Instruction — do not read</span>
			</div>
		</header>

		{#if narration}
			<article class="narration" dir="rtl">
				{#each blocks as b}
					{#if b.kind === "heading"}
						<h2 class="slide">{b.text}</h2>
					{:else if b.kind === "cue"}
						<p class="cue">{b.text}</p>
					{:else}
						<p class="spoken">{b.text}</p>
					{/if}
				{/each}
			</article>
		{:else}
			<p class="empty">No narration written yet.</p>
		{/if}
	{/if}
</div>

<style>
	.page {
		max-width: 900px;
		color: aliceblue;
		margin: 40px auto;
		padding: 0 24px;
		font-family: system-ui, sans-serif;
	}

	.links { display: flex; gap: 10px; margin-bottom: 20px; }

	.editor-link {
		display: inline-flex; align-items: center; gap: 6px;
		padding: 6px 12px; width: fit-content;
		border: 1px solid #3a4a63; border-radius: 6px;
		background: #16202e; color: #5fa8ff;
		font-size: 0.85rem; font-weight: 600; text-decoration: none;
		transition: background .15s, border-color .15s;
	}
	.editor-link:hover { background: #1e2c40; border-color: #5fa8ff; }

	header { margin-bottom: 30px; padding-bottom: 16px; border-bottom: 1px solid #333; }
	h1 { margin: 0 0 10px; }

	.meta {
		display: flex; flex-wrap: wrap; justify-content: space-between;
		gap: 8px; font-size: .85rem; opacity: .7;
	}

	.legend { display: flex; gap: 14px; margin-top: 12px; font-size: .8rem; }
	.lg { padding: 2px 10px; border-radius: 4px; }
	.spoken-lg { color: #ffffff; background: #1e293b; font-weight: 700; }
	.cue-lg { color: #fbbf24; background: #2a2110; }

	/* ---------- narration ---------- */
	.narration {
		font-family: "Noto Nastaliq Urdu", serif;
		text-align: right;
	}

	.narration p,
	.narration h2 {
		unicode-bidi: plaintext; /* keeps (English) in brackets readable inside Urdu */
	}

	.slide {
		font-family: system-ui, sans-serif;
		direction: ltr;
		text-align: left;
		font-size: 1rem;
		font-weight: 700;
		color: #5fa8ff;
		margin: 36px 0 12px;
		padding-bottom: 6px;
		border-bottom: 1px solid #1e3a5f;
	}

	.spoken {
		font-size: 1.45rem;
		font-weight: 700;
		line-height: 2.6;
		color: #ffffff;
		margin: 0 0 14px;
	}

	.cue {
		font-size: 1.05rem;
		font-weight: 400;
		line-height: 2.3;
		color: #fbbf24;
		background: #2a2110;
		border-right: 3px solid #f59e0b;
		border-radius: 6px;
		padding: 2px 14px;
		margin: 0 0 10px;
	}

	.empty { opacity: .6; font-style: italic; }
	.message { padding: 12px; background: #eee; color: #222; border-radius: 5px; }

	@media (max-width: 600px) {
		.page { padding: 0 16px; margin: 20px auto; }
		.spoken { font-size: 1.2rem; line-height: 2.4; }
		.cue { font-size: .95rem; }
	}
</style>