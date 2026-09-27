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

	let wordCount = $derived(
		narration ? narration.split(/\s+/).length : 0
	);

	// rough speaking pace ~130 words per minute
	let speakingMinutes = $derived(
		Math.max(1, Math.round(wordCount / 130))
	);

	async function load() {
		try {
			if (!slug) {
				throw new Error("Slug is required");
			}

			const data = await send("adminLibrary", "get", { slug });

			if (!data) {
				throw new Error(`"${slug}" not found`);
			}

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
					<span>{wordCount} words · ~{speakingMinutes} min spoken</span>
				{/if}
			</div>
		</header>

		{#if narration}
			<article class="narration">{narration}</article>
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

	.links {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}

	.editor-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		width: fit-content;
		border: 1px solid #3a4a63;
		border-radius: 6px;
		background: #16202e;
		color: #5fa8ff;
		font-size: 0.85rem;
		font-weight: 600;
		text-decoration: none;
		transition: background .15s, border-color .15s;
	}

	.editor-link:hover {
		background: #1e2c40;
		border-color: #5fa8ff;
	}

	header {
		margin-bottom: 30px;
		padding-bottom: 16px;
		border-bottom: 1px solid #333;
	}

	h1 {
		margin: 0 0 10px;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		gap: 8px;
		font-size: .85rem;
		opacity: .7;
	}

	.narration {
		white-space: pre-wrap;
		overflow-wrap: break-word;
		font-size: 1.3rem;
		line-height: 1.9;
	}

	.empty {
		opacity: .6;
		font-style: italic;
	}

	.message {
		padding: 12px;
		background: #eee;
		color: #222;
		border-radius: 5px;
	}

	@media (max-width: 600px) {
		.page {
			padding: 0 16px;
			margin: 20px auto;
		}

		.narration {
			font-size: 1.1rem;
			line-height: 1.8;
		}
	}
</style>