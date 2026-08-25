
<script>
	import { onMount } from "svelte";

	let form = {
		slug: "",
		title: "",
		body: "",
		tags: "[]"
	};

	let message = "";

	let slug = "";

	onMount(async () => {
		slug = new URLSearchParams(location.search).get("slug") || "";

		if (!slug) {
			message = "Missing SVG slug";
			return;
		}

		try {
			const res = await fetch(
				`/edit/svg?slug=${encodeURIComponent(slug)}`
			);

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed to load SVG");
			}

			form = {
				...form,
				...data
			};

			message = "";

		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	});


	async function submit() {

		message = "Saving...";

		try {

			const res = await fetch(
				`/edit/svg?slug=${encodeURIComponent(slug)}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(form)
				}
			);

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Failed");
			}

			form = {
				...form,
				...data
			};

			message = `Updated: ${data.slug}`;

		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	}
</script>

<div class="page">
	{#if loading}
		<p>{message}</p>
	{:else}
		<h1>Edit Player</h1>

		<div class="identity">
			<div><strong>Slug:</strong> {form.slug}</div>
			<div><strong>Course:</strong> {form.courseSlug}</div>
			<div><strong>Group:</strong> {form.groupSlug}</div>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
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
				Body
				<textarea class="body" bind:value={form.body}></textarea>
			</label>

			<label>
				Sort Order
				<input type="number" bind:value={form.sortOrder}>
			</label>

			<label class="check">
				<input type="checkbox" bind:checked={form.allowCommunication}>
				Allow Communication
			</label>

			<label>
				Meta
				<textarea bind:value={form.meta}></textarea>
			</label>

			<button type="submit" disabled={saving}>
				{saving ? "Saving..." : "Save Player"}
			</button>
		</form>

		{#if message}
			<p class="message">{message}</p>
		{/if}
	{/if}

	<div class="danger-zone">
	<button
		class="delete"
		type="button"
		onclick={deletePlayer}
		disabled={saving || deleting}
	>
		{deleting ? "Deleting..." : "Delete Player"}
	</button>
</div>
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

	input, textarea {
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
	.danger-zone {
	margin-top: 50px;
	padding-top: 20px;
	border-top: 1px solid #555;
}

.delete {
	background: #8b2f2f;
}

.delete:hover {
	background: #a33a3a;
}
</style>