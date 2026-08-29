<script>
	import { onMount } from "svelte";
	import { frontend } from "$lib/frontEnd";

	let form = {
		slug: "",
		title: "",
		tags: "[]"
	};

	let message = "";
	let slug = "";

	onMount(async () => {

		slug = new URLSearchParams(location.search).get("slug");

		if (!slug) {
			message = "Missing audio slug";
			return;
		}

		try {
			const data = await frontend.audio.get(slug);

			form = {
				slug: data.slug,
				title: data.title || "",
				tags: data.tags || "[]"
			};

		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	});


	async function submit() {

		message = "Saving...";

		try {

			const data = await frontend.audio.update(slug, {
				title: form.title,
				tags: form.tags
			});

			form = {
				slug: data.slug,
				title: data.title || "",
				tags: data.tags || "[]"
			};

			message = `Updated: ${data.slug}`;

		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	}
</script>

<div class="page">
	<h1>Edit Audio</h1>

	<form on:submit|preventDefault={submit}>

		<label>
			Slug
			<input bind:value={form.slug} disabled>
		</label>

		<label>
			Title
			<input bind:value={form.title}>
		</label>

		<label>
			Tags
			<input
				bind:value={form.tags}
				placeholder="algebra, introduction, chapter-1"
			>
		</label>

		<button type="submit">
			Update Audio
		</button>

	</form>

	{#if message}
		<p class="message">{message}</p>
	{/if}
</div>


<style>
	.page {
		max-width: 800px;
		color: aliceblue;
		margin: 40px auto;
		padding: 0 24px;
		font-family: system-ui, sans-serif;
	}

	h1 {
		margin-bottom: 30px;
	}

	form {
		display: grid;
		gap: 18px;
	}

	label {
		display: grid;
		gap: 6px;
		font-weight: 600;
	}

	input {
		box-sizing: border-box;
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #bbb;
		border-radius: 5px;
		font: inherit;
		background: white;
	}

	button {
		width: fit-content;
		padding: 10px 20px;
		border: 0;
		border-radius: 5px;
		background: #222;
		color: white;
		font: inherit;
		cursor: pointer;
	}

	button:hover {
		background: #444;
	}

	.message {
		margin-top: 20px;
		padding: 12px;
		background: #eee;
		color: #222;
		border-radius: 5px;
	}
</style>