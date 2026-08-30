<script>
///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/create/content/+page.svelte
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	const courseSlug = page.url.searchParams.get("course");

	let groupings = $state([]);
	let message = $state(courseSlug ? "" : "Error: course is required");
	let loading = $state(true);
	let saving = $state(false);

	let form = $state({
		slug: "",
		title: "",
		type: "ARTICLE",
		groupSlug: "",
		description: "",
		thumbnail: "",
		body: "",
		sortOrder: 0,
		allowCommunication: true,
		meta: ""
	});

	async function loadGroups() {
		try {
			groupings = await send("group", "list", { courseSlug });

			if (groupings.length) {
				form.groupSlug = groupings[0].slug;
			}
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			loading = false;
		}
	}

	async function submit() {
		message = "Saving...";
		saving = true;

		try {
			const data = await send("library", "create", {
				slug: form.slug,
				courseSlug,
				groupSlug: form.groupSlug,
				type: form.type,
				title: form.title,
				description: form.description,
				thumbnail: form.thumbnail,
				body: form.body,
				sortOrder: form.sortOrder,
				allowCommunication: form.allowCommunication,
				meta: form.meta
			});

			goto(`${config.basePath}/lessons?course=${encodeURIComponent(courseSlug)}`);
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			saving = false;
		}
	}

	$effect(() => {
		if (courseSlug) loadGroups();
	});
</script>

<div class="page">
	{#if loading}

		<p>{message}</p>

	{:else}

		<h1>New Content</h1>

		<div class="identity">
			<div><strong>Course:</strong> {courseSlug}</div>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); submit(); }}>

			<label>
				Type
				<select bind:value={form.type}>
					<option value="ARTICLE">Article</option>
					<option value="PLAYER">Player</option>
				</select>
			</label>

			<label>
				Group
				<select bind:value={form.groupSlug} required>
					{#each groupings as group}
						<option value={group.slug}>{group.title}</option>
					{/each}
				</select>
			</label>

			<label>
				Slug
				<input bind:value={form.slug} required>
			</label>

			<label>
				Title
				<input bind:value={form.title} required>
			</label>

			<label>
				Description
				<textarea bind:value={form.description}></textarea>
			</label>

			<label>
				Thumbnail
				<input bind:value={form.thumbnail}>
			</label>

			<label>
				{form.type === "PLAYER" ? "Deck JSON" : "Body"}
				<textarea
					class="body"
					bind:value={form.body}
				></textarea>
			</label>

			<label>
				Sort Order
				<input type="number" bind:value={form.sortOrder}>
			</label>

			<label class="check">
				<input
					type="checkbox"
					bind:checked={form.allowCommunication}
				>
				Allow Communication
			</label>

			<label>
				Meta
				<textarea bind:value={form.meta}></textarea>
			</label>

			<button type="submit" disabled={saving}>
				{saving ? "Saving..." : "Create Content"}
			</button>

		</form>

		{#if message}
			<p class="message">{message}</p>
		{/if}

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

	h1 { margin-bottom: 20px; }

	.identity {
		margin-bottom: 30px;
		padding: 12px;
		background: #171717;
		border: 1px solid #333;
		border-radius: 6px;
		display: grid;
		gap: 5px;
		font-size: .9rem;
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

	input, textarea, select {
		box-sizing: border-box;
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #bbb;
		border-radius: 5px;
		font: inherit;
		font-weight: 400;
		background: white;
	}

	textarea {
		min-height: 90px;
		resize: vertical;
	}

	textarea.body {
		min-height: 300px;
		font-family: monospace;
	}

	.check {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 400;
	}

	.check input { width: auto; }

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

	button:hover { background: #444; }
	button:disabled { opacity: .5; cursor: default; }

	.message {
		margin-top: 20px;
		padding: 12px;
		background: #eee;
		color: #222;
		border-radius: 5px;
	}
</style>