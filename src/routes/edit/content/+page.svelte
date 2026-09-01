<script>
///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/edit/content/+page.svelte
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	let deleting = $state(false);

	let form = $state({
		slug: "",
		title: "",
		description: "",
		thumbnail: "",
		body: "",
		courseSlug: "",
		groupSlug: "",
		type: "ARTICLE",
		status: "DRAFT",
		sortOrder: 0,
		allowCommunication: true,
		meta: ""
	});

	let message = $state("Loading...");
	let loading = $state(true);
	let saving = $state(false);

	async function load() {
		try {
			const course = page.url.searchParams.get("course");
			const group = page.url.searchParams.get("group");
			const slug = page.url.searchParams.get("slug");

			if (!course || !group || !slug) {
				throw new Error("Course, group and slug are required");
			}

			const data = await send("library", "get", { slug });

			if (!data) {
				throw new Error(`"${slug}" not found`);
			}

			form = {
				slug: data.slug,
				title: data.title ?? "",
				description: data.description ?? "",
				thumbnail: data.thumbnail ?? "",
				body: data.body ?? "",
				courseSlug: data.courseSlug ?? course,
				groupSlug: data.groupSlug ?? group,
				type: data.type ?? "ARTICLE",
				status: data.status ?? "DRAFT",
				sortOrder: data.sortOrder ?? 0,
				allowCommunication: data.allowCommunication ?? true,
				meta: data.meta ?? ""
			};

			message = "";
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
			const data = await send("library", "update", {
				slug: form.slug,
				data: {
					title: form.title,
					description: form.description,
					thumbnail: form.thumbnail,
					body: form.body,
					type: form.type,
					status: form.status,
					sortOrder: form.sortOrder,
					allowCommunication: form.allowCommunication,
					meta: form.meta
				}
			});

			message = `Saved: ${data.slug}`;
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			saving = false;
		}
	}

	async function deleteContent() {
		if (!confirm(`Delete "${form.slug}"?`)) return;

		deleting = true;
		message = "Deleting...";

		try {
			const course = page.url.searchParams.get("course");

			await send("library", "delete", { slug: form.slug });

			goto(`${config.basePath}/lessons?course=${encodeURIComponent(course)}`);
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
			deleting = false;
		}
	}

	$effect(() => {
		load();
	});
</script>

<div class="page">
	{#if loading}

		<p>{message}</p>

	{:else}

		<h1>Edit {form.type === "PLAYER" ? "Player" : form.type === "MCQ" ? "MCQ" : "Article"}</h1>

		<div class="identity">
			<div><strong>Slug:</strong> {form.slug}</div>
			<div><strong>Course:</strong> {form.courseSlug}</div>
			<div><strong>Group:</strong> {form.groupSlug}</div>
		</div>
{#if form.type === "PLAYER"}
	<a
		class="editor-link"
		href={`${config.basePath}/edit/editor?course=${encodeURIComponent(form.courseSlug)}&group=${encodeURIComponent(form.groupSlug)}&slug=${encodeURIComponent(form.slug)}&role=PLAYER`}
	>
		Slide Editor 🚧 🚜 🏗️ 
	</a>
{/if}
		<form onsubmit={(e) => { e.preventDefault(); submit(); }}>

			<label>
				Type
				<select bind:value={form.type}>
					<option value="ARTICLE">Article</option>
					<option value="PLAYER">Player</option>
					<option value="MCQ">MCQ</option>
				</select>
			</label>

			<label>
				Status
				<select bind:value={form.status}>
					<option value="DRAFT">Draft</option>
					<option value="PUBLISHED">Published</option>
					<option value="ARCHIVED">Archived</option>
				</select>
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
				{saving ? "Saving..." : "Save Content"}
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
			onclick={deleteContent}
			disabled={saving || deleting}
		>
			{deleting ? "Deleting..." : "Delete Content"}
		</button>
	</div>
</div>

<style>
.editor-link {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 20px;
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