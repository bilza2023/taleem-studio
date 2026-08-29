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
			message = "Missing image slug";
			return;
		}

		try {
			const data = await frontend.image.get(slug);

			form = {
				...form,
				...data
			};

		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	});


	async function submit() {

		message = "Saving...";

		try {

			const data = await frontend.image.update(slug, {
				title: form.title,
				tags: form.tags
			});

			form = {
				...form,
				...data
			};

			message = `Updated: ${data.slug}`;

		} catch(error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	}
</script>
<div class="page">

	<h1>Edit Image</h1>

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
				placeholder='["math","number-line"]'
			>
		</label>

		<button type="submit">
			Update Image
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
		font-weight: 400;
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