<script>
///home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/create/bulk-group/+page.svelte

	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	const courseSlug = page.url.searchParams.get("course");

	let existing = $state([]);
	let message = $state(courseSlug ? "" : "Error: course is required");
	let loading = $state(true);
	let saving = $state(false);
	let results = $state([]);
	let raw = $state("");

	async function loadGroups() {
		try {
			existing = await send("group", "list", { courseSlug });
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			loading = false;
		}
	}

	// Accepts strict JSON, and also the JS style used in bulk-groups.js
	// (unquoted keys, trailing commas):  [{ slug: "7.1", title: "Exercise 7.1" }, ...]
	function toJson(text) {
		try {
			return JSON.parse(text);
		} catch {
			const fixed = text
				.replace(/([{,]\s*)(slug|title)\s*:/g, '$1"$2":') // quote the two keys
				.replace(/,\s*([}\]])/g, "$1");                   // drop trailing commas
			return JSON.parse(fixed);
		}
	}

	function parseGroups() {
		const groups = [];
		const errors = [];
		const seen = new Set();

		let data;
		try {
			data = toJson(raw.trim());
		} catch (e) {
			return { groups, errors: [`Not valid JSON — ${e.message}`] };
		}

		if (!Array.isArray(data)) {
			return { groups, errors: ["Expected an array: [ { slug, title }, ... ]"] };
		}

		data.forEach((item, i) => {
			const slug = typeof item?.slug === "string" ? item.slug.trim() : "";
			const title = typeof item?.title === "string" ? item.title.trim() : "";

			if (!slug || !title) {
				errors.push(`Item ${i + 1}: needs both slug and title`);
				return;
			}
			if (seen.has(slug)) {
				errors.push(`Item ${i + 1}: duplicate slug "${slug}"`);
				return;
			}
			seen.add(slug);
			groups.push({ slug, title });
		});

		return { groups, errors };
	}

	async function submit() {
		const { groups, errors } = parseGroups();

		if (errors.length) {
			message = `Error: ${errors.join(" · ")}`;
			return;
		}
		if (!groups.length) {
			message = "Error: at least one group is required";
			return;
		}

		message = "";
		results = [];
		saving = true;

		const have = new Set(existing.map((g) => g.slug));

		for (const g of groups) {
			if (have.has(g.slug)) {
				results = [...results, { slug: g.slug, title: g.title, status: "skip" }];
				continue;
			}

			try {
				await send("group", "create", { courseSlug, slug: g.slug, title: g.title });
				results = [...results, { slug: g.slug, title: g.title, status: "ok" }];
			} catch (error) {
				console.error(error);
				results = [...results, { slug: g.slug, title: g.title, status: "fail", error: error.message }];
			}
		}

		saving = false;
		await loadGroups(); // so a second run skips what was just created

		const count = (s) => results.filter((r) => r.status === s).length;
		message = `Done — ${count("ok")} created, ${count("skip")} already existed, ${count("fail")} failed.`;
	}

	function goToLessons() {
		goto(`${config.basePath}/admin/lessons?course=${encodeURIComponent(courseSlug)}`);
	}

	$effect(() => {
		if (courseSlug) loadGroups();
		else loading = false;
	});
</script>

<div class="page">
	{#if loading}

		<p>Loading...</p>

	{:else if !courseSlug}

		<p class="message">{message}</p>

	{:else}

		<h1>Bulk Create Groups</h1>

		<div class="identity">
			<div><strong>Course:</strong> {courseSlug}</div>
			<div><strong>Existing groups:</strong> {existing.length}</div>
		</div>

		<form onsubmit={(e) => { e.preventDefault(); submit(); }}>

			<label>
				Groups (JSON array)
				<textarea
					class="body"
					bind:value={raw}
					placeholder={'[\n  { "slug": "7.1", "title": "Exercise 7.1" },\n  { "slug": "7.2", "title": "Exercise 7.2" }\n]'}
					spellcheck="false"
					required
				></textarea>
				<small class="hint">
					Shape: <code>[ {"{"} slug, title {"}"}, … ]</code> — course comes from the URL.
					Existing slugs are skipped.
				</small>
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
					<li class={r.status}>
						{r.status === "ok" ? "✅" : r.status === "skip" ? "⏭" : "❌"}
						{r.slug} — {r.title}
						{#if r.status === "skip"}<span class="err"> (already exists)</span>{/if}
						{#if r.status === "fail"}<span class="err"> — {r.error}</span>{/if}
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

	textarea {
		box-sizing: border-box;
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #bbb;
		border-radius: 5px;
		font: inherit;
		font-weight: 400;
		background: white;
		resize: vertical;
	}

	textarea.body {
		min-height: 180px;
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

	.hint {
		font-weight: 400;
		font-size: .8rem;
		opacity: .7;
	}

	.hint code {
		font-family: monospace;
	}

	.results .skip { opacity: .7; }
	.results .fail { color: #ff8080; }
	.results .err { opacity: .7; }
</style>