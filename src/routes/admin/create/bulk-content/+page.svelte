<script>
///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/create/bulk-content/+page.svelte
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";
	import ImagePicker from "$lib/editor/slides/components/ImagePicker.svelte";

	const courseSlug = page.url.searchParams.get("course");

	let groupings = $state([]);
	let message = $state(courseSlug ? "" : "Error: course is required");
	let loading = $state(true);
	let saving = $state(false);
	let results = $state([]);

	let form = $state({
		slugsRaw: "",
		type: "ARTICLE",
		groupSlug: "",
		thumbnail: ""
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

	function useThumbnail(slug) {
		form.thumbnail = slug;
	}

	function parseSlugs() {
		return form.slugsRaw
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}

	function titleFromSlug(slug) {
		return slug
			.replace(/[-_]+/g, " ")
			.replace(/\b\w/g, (c) => c.toUpperCase());
	}

	async function submit() {
		const slugs = parseSlugs();

		if (!slugs.length) {
			message = "Error: at least one slug is required";
			return;
		}

		message = "";
		results = [];
		saving = true;

		// NOTE: assumes send("adminLibrary", "list", { groupSlug }) returns
		// the existing items in this group — confirm this signature against
		// the real library.js before relying on it (the library/adminLibrary
		// split hasn't been fully verified yet). Falls back to sortOrder 0
		// if the fetch fails, so bulk create still works, just without the
		// max+1 offset.
		let nextSortOrder = 0;

		try {
			const existing = await send("adminLibrary", "list", { groupSlug: form.groupSlug });

			if (existing?.length) {
				nextSortOrder = Math.max(...existing.map((i) => i.sortOrder ?? 0)) + 1;
			}
		} catch (error) {
			console.error("Could not fetch existing sortOrder, defaulting to 0", error);
		}

		for (const slug of slugs) {
			try {
				await send("adminLibrary", "create", {
					slug,
					courseSlug,
					groupSlug: form.groupSlug,
					type: form.type,
					title: titleFromSlug(slug),
					description: "",
					thumbnail: form.thumbnail,
					body: "",
					sortOrder: nextSortOrder,
					allowCommunication: true,
					meta: ""
				});

				results = [...results, { slug, ok: true }];
				nextSortOrder++;
			} catch (error) {
				console.error(error);
				results = [...results, { slug, ok: false, error: error.message }];
			}
		}

		saving = false;

		const failed = results.filter((r) => !r.ok).length;
		message = failed
			? `Done — ${results.length - failed} created, ${failed} failed.`
			: `Done — all ${results.length} items created.`;
	}

	function goToLessons() {
		goto(`${config.basePath}/admin/lessons?course=${encodeURIComponent(courseSlug)}`);
	}

	$effect(() => {
		if (courseSlug) loadGroups();
	});
</script>

<div class="page">
	{#if loading}

		<p>{message}</p>

	{:else}

		<h1>Bulk Create Content</h1>

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
				Slugs (comma separated)
				<textarea
					class="body"
					bind:value={form.slugsRaw}
					placeholder="fbise9math-ex4.6-q01, fbise9math-ex4.6-q02, fbise9math-ex4.6-q03"
					required
				></textarea>
			</label>

			<label>
				Thumbnail
				<ImagePicker
					value={form.thumbnail}
					onUse={useThumbnail}
				/>
			</label>

			<button type="submit" disabled={saving}>
				{saving ? "Creating..." : "Bulk Create"}
			</button>

		</form>

		{#if message}
			<p class="message">{message}</p>
		{/if}

		{#if results.length}
			<ul class="results">
				{#each results as r}
					<li class={r.ok ? "ok" : "fail"}>
						{r.ok ? "✅" : "❌"} {r.slug}
						{#if !r.ok}<span class="err"> — {r.error}</span>{/if}
					</li>
				{/each}
			</ul>

			<button type="button" onclick={goToLessons}>
				Done — go to Lessons
			</button>
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
		min-height: 140px;
		font-family: monospace;
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

	button:hover { background: #444; }
	button:disabled { opacity: .5; cursor: default; }

	.message {
		margin-top: 20px;
		padding: 12px;
		background: #eee;
		color: #222;
		border-radius: 5px;
	}

	.results {
		margin-top: 20px;
		padding: 12px;
		background: #171717;
		border: 1px solid #333;
		border-radius: 6px;
		list-style: none;
		display: grid;
		gap: 4px;
		font-size: .9rem;
	}

	.results .fail { color: #ff8080; }
	.results .err { opacity: .7; }
</style>