<script>
// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/edit/content/+page.svelte
import { bundleDeck, downloadJSON } from "./js/bundleDeck.js";
import { page } from "$app/state";
import { goto } from "$app/navigation";
import { send } from "$lib/send";
import { config } from "$lib/config.js";
import Tags from "$lib/components/Tags.svelte";
import ImagePicker from "$lib/editor/slides/components/ImagePicker.svelte";
import tagsList from "$lib/utils/tags-list.json";

	let deleting = $state(false);
	let archiving = $state(false);
	let bundling = $state(false);

	let form = $state({
		slug: "",
		title: "",
		description: "",
		thumbnail: "",
		body: "",
		narration: "",
		courseSlug: "",
		groupSlug: "",
		type: "ARTICLE",
		status: "DRAFT",
		sortOrder: 0,
		allowCommunication: true,
		meta: "",
		tags: []
	});

	let message = $state("Loading...");
	let loading = $state(true);
	let saving = $state(false);

	const enc = encodeURIComponent;
	const coursePageUrl = () =>
		`${config.basePath}/admin/course?course=${enc(form.courseSlug)}&group=${enc(form.groupSlug)}`;

	function useThumbnail(slug) {
		form.thumbnail = slug;
	}

	function parseTags(raw) {
		if (Array.isArray(raw)) return raw;
		try {
			const value = JSON.parse(raw ?? "[]");
			return Array.isArray(value) ? value : [];
		} catch {
			return [];
		}
	}

	async function load() {
		try {
			const course = page.url.searchParams.get("course");
			const group = page.url.searchParams.get("group");
			const slug = page.url.searchParams.get("slug");

			if (!slug) throw new Error("slug is required");

			const data = await send("library", "get", { slug });
			if (!data) throw new Error(`"${slug}" not found`);

			form = {
				slug: data.slug,
				title: data.title ?? "",
				description: data.description ?? "",
				thumbnail: data.thumbnail ?? "",
				body: data.body ?? "",
				narration: data.narration ?? "",
				courseSlug: data.courseSlug ?? course ?? "",
				groupSlug: data.groupSlug ?? group ?? "",
				type: data.type ?? "ARTICLE",
				status: data.status ?? "DRAFT",
				sortOrder: data.sortOrder ?? 0,
				allowCommunication: data.allowCommunication ?? true,
				meta: data.meta ?? "",
				tags: parseTags(data.tags)
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
				changes: {
					title: form.title,
					description: form.description,
					thumbnail: form.thumbnail,
					body: form.body,
					narration: form.narration,
					type: form.type,
					status: form.status,
					sortOrder: Number(form.sortOrder) || 0,
					allowCommunication: form.allowCommunication,
					meta: form.meta,
										tags: form.tags
				}
			});

			if (data?.status) form.status = data.status;
			message = `Saved: ${data?.slug ?? form.slug}`;
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			saving = false;
		}
	}

	// teacher-safe: hides the item, keeps the row
	async function archiveContent() {
		if (!confirm(`Archive "${form.slug}"? Students will no longer see it.`)) return;

		archiving = true;
		message = "Archiving...";
		try {
			const data = await send("library", "archive", { slug: form.slug });
			form.status = data?.status ?? "ARCHIVED";
			message = "Archived.";
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			archiving = false;
		}
	}

	// super only: removes the row (ratings cascade)
	async function deleteContent() {
		if (!confirm(`Delete "${form.slug}" permanently?\nThis cannot be undone.`)) return;

		deleting = true;
		message = "Deleting...";
		try {
			await send("library", "delete", { slug: form.slug });
			goto(coursePageUrl());
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`; // 403 for non-super admins
			deleting = false;
		}
	}

	async function downloadBundle() {
		let deck;
		try {
			deck = JSON.parse(form.body);
		} catch {
			alert("Deck JSON is invalid — fix it before bundling.");
			return;
		}

		bundling = true;
		try {
			const bundle = await bundleDeck(deck);
			if (bundle.missing.length) alert(`Missing SVGs:\n${bundle.missing.join("\n")}`);
			downloadJSON(bundle, `${form.slug}.bundle.json`);
		} catch (error) {
			console.error(error);
			alert(`Bundle failed: ${error.message}`);
		} finally {
			bundling = false;
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
			<div><strong>Status:</strong> {form.status}</div>
		</div>

		<a class="editor-link" href={coursePageUrl()}>← Back to chapter</a>

		{#if form.type === "PLAYER"}
			<a
				class="editor-link"
				href={`${config.basePath}/admin/edit/editor?course=${enc(form.courseSlug)}&group=${enc(form.groupSlug)}&slug=${enc(form.slug)}&role=PLAYER`}
			>Slide Editor 🚧</a>

			<a class="editor-link" href={`${config.basePath}/admin/timings?slug=${enc(form.slug)}`}>Timings 🚦</a>

			<a class="editor-link" href={`${config.basePath}/player?lesson=${enc(form.slug)}`} target="_blank">Play ▶</a>

			<button type="button" class="editor-link" onclick={downloadBundle} disabled={bundling}>
				{bundling ? "Bundling…" : "Bundle 🎒"}
			</button>
		{:else if form.type === "ARTICLE"}
			<a class="editor-link" href={`${config.basePath}/articles?article=${enc(form.slug)}`} target="_blank">View ▶</a>
		{/if}

		<a
			class="editor-link"
			href={`${config.basePath}/admin/edit/move?course=${enc(form.courseSlug)}&group=${enc(form.groupSlug)}&slug=${enc(form.slug)}`}
		>Move 🚜</a>
		<a
			class="editor-link"
			href={`${config.basePath}/admin/edit/copy?course=${enc(form.courseSlug)}&group=${enc(form.groupSlug)}&slug=${enc(form.slug)}`}
		>Copy 🏗️</a>
		<a
			class="editor-link"
			href={`${config.basePath}/admin/narration?course=${enc(form.courseSlug)}&group=${enc(form.groupSlug)}&slug=${enc(form.slug)}`}
		>Narration 📢</a>

		<Tags
			available={tagsList}
			tags={form.tags}
			onChange={(next) => (form.tags = next)}
		/>

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
				<ImagePicker value={form.thumbnail} onUse={useThumbnail} />
			</label>

			<label>
				{form.type === "PLAYER" ? "Deck JSON" : "Body"}
				<textarea class="body" bind:value={form.body}></textarea>
			</label>

			{#if form.type === "PLAYER"}
				<label>
					Narration
					<textarea
						class="narration"
						bind:value={form.narration}
						placeholder="What to say — the final script to be recorded as audio"
					></textarea>
				</label>
			{/if}

			<label>
				Sort Order
				<input type="number" bind:value={form.sortOrder}>
			</label>

			<label class="check">
				<input type="checkbox" bind:checked={form.allowCommunication}>
				Allow rating
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

		<div class="danger-zone">
			<button
				class="delete"
				type="button"
				onclick={archiveContent}
				disabled={saving || archiving || deleting || form.status === "ARCHIVED"}
			>
				{archiving ? "Archiving..." : form.status === "ARCHIVED" ? "Archived" : "Archive"}
			</button>

			<button
				class="delete"
				type="button"
				onclick={deleteContent}
				disabled={saving || archiving || deleting}
				title="Super admin only"
			>
				{deleting ? "Deleting..." : "Delete permanently"}
			</button>
		</div>

	{/if}
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

	textarea.narration {
		min-height: 300px;
		line-height: 1.6;
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