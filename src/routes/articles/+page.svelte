<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/articles/+page.svelte
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import { send } from "$lib/send";
	import Locked from "$lib/components/Locked.svelte";
	import Rating from "$lib/components/Rating.svelte";

	let librarySlug = $state("");
	let libraryItem = $state(null);
	let error = $state("");
	let loading = $state(true);
	let locked = $state(false);

	let articleBody = $derived.by(() => {
		if (!libraryItem?.body) return "";
		return libraryItem.body.replaceAll('src="', `src="/content/images/`);
	});

	// paid course, no active subscription
	const isLocked = (e) => e?.status === 403 || /subscription/i.test(e?.message ?? "");

	onMount(async () => {
		librarySlug = page.url.searchParams.get("article");

		if (!librarySlug) {
			error = "No article specified.";
			loading = false;
			return;
		}

		try {
			libraryItem = await send("library", "get", { slug: librarySlug });
			if (!libraryItem) error = "Article not found.";
		} catch (err) {
			if (isLocked(err)) locked = true;
			else error = err.message;
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<main class="container">
		<p>Loading article…</p>
	</main>
{:else if locked}
	<Locked />
{:else if error}
	<main class="container">
		<h2>{error}</h2>
	</main>
{:else}
	<main class="container">
		{@html articleBody}
	</main>
	<Rating librarySlug={libraryItem.slug} allowed={libraryItem.allowCommunication !== false} />
{/if}
<style>
	.container {
		width: min(95vw, 1600px);
		min-height: 100vh;
		margin: 0 auto;
		padding: 1rem 2rem;
		box-sizing: border-box;
		background: var(--theme-panel);
		color: var(--theme-text);
		font-size: 1.75rem;
		line-height: 1.8;
	}

	:global(.container img) {
		display: block;
		width: 100%;
		max-width: 100%;
		height: auto;
		margin: 1.5rem auto;
		border-radius: 8px;
	}

	:global(.container ul) {
		padding-left: 1.5rem;
	}

	:global(.container table) {
		display: block;
		overflow-x: auto;
		width: 100%;
		border-color: var(--theme-border);
	}

	:global(.container a) {
		color: var(--theme-accent);
	}

	:global(.container hr) {
		border-color: var(--theme-border);
	}

	:global(.container blockquote) {
		border-left: 4px solid var(--theme-accent);
		padding-left: 1rem;
	}

	:global(.container code) {
		background: var(--theme-panel);
		border: 1px solid var(--theme-border);
		color: var(--theme-text);
		padding: .1rem .3rem;
		border-radius: 4px;
	}

	.secondary {
		padding: 1rem;
		margin-top: 2rem;
		border: 1px solid var(--theme-border);
		border-radius: 8px;
		color: var(--theme-text);
		background: var(--theme-panel);
	}

	@media (max-width: 768px) {
		.container {
			padding: 1rem;
			font-size: 1rem;
			line-height: 1.7;
		}

		:global(.container h1) {
			font-size: 2rem;
		}

		:global(.container h2) {
			font-size: 1.6rem;
		}

		:global(.container h3) {
			font-size: 1.3rem;
		}

		:global(.container img) {
			width: 100%;
			max-width: 100%;
		}
	}
</style>