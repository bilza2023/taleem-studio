<script>
///home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/create/bulk-update/+page.svelte
// Same job as scripts/bulk-upload.js: paste data.json → each deck's body is replaced.

	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	const courseSlug = page.url.searchParams.get("course"); // optional, only for the "go to Lessons" button

	let raw = $state("");
	let message = $state("");
	let saving = $state(false);
	let progress = $state("");
	let results = $state([]);

	// Validate the whole paste first — if anything is wrong, nothing is written.
	function parseItems() {
		const items = [];
		const errors = [];
		const seen = new Set();

		let data;
		try {
			data = JSON.parse(raw.trim());
		} catch (e) {
			return { items, errors: [`Not valid JSON — ${e.message}`] };
		}

		if (!Array.isArray(data)) {
			return { items, errors: ["Expected an array: [ { slug, body }, ... ]"] };
		}

		data.forEach((item, i) => {
			const slug = typeof item?.slug === "string" ? item.slug.trim() : "";
			const body = item?.body;

			if (!slug) {
				errors.push(`Item ${i + 1}: missing slug`);
				return;
			}
			if (!body || typeof body !== "object" || !Array.isArray(body.deck)) {
				errors.push(`Item ${i + 1} (${slug}): body must be an object with a deck array`);
				return;
			}
			if (seen.has(slug)) {
				errors.push(`Item ${i + 1}: duplicate slug "${slug}"`);
				return;
			}
			seen.add(slug);
			items.push({ slug, body });
		});

		return { items, errors };
	}

	async function submit() {
		const { items, errors } = parseItems();

		if (errors.length) {
			message = `Error: ${errors.join(" · ")}`;
			return;
		}
		if (!items.length) {
			message = "Error: at least one item is required";
			return;
		}

		message = "";
		results = [];
		saving = true;

		for (const [i, item] of items.entries()) {
			progress = `Updating ${i + 1} of ${items.length}…`;

			try {
				await send("adminLibrary", "update", {
					slug: item.slug,
					data: { body: JSON.stringify(item.body) }
				});
				results = [...results, { slug: item.slug, ok: true }];
			} catch (error) {
				console.error(error);
				const reason = /not found|record to update/i.test(error.message)
					? "slug not found"
					: error.message;
				results = [...results, { slug: item.slug, ok: false, error: reason }];
			}
		}

		saving = false;
		progress = "";

		const failed = results.filter((r) => !r.ok).length;
		message = failed
			? `Done — ${results.length - failed} updated, ${failed} failed.`
			: `Done — all ${results.length} decks updated.`;
	}

	function goToLessons() {
		goto(`${config.basePath}/admin/lessons?course=${encodeURIComponent(courseSlug)}`);
	}
</script>

<div class="page">

	<h1>Bulk Update Decks</h1>

	{#if courseSlug}
		<div class="identity">
			<div><strong>Course:</strong> {courseSlug}</div>
		</div>
	{/if}

	<form onsubmit={(e) => { e.preventDefault(); submit(); }}>

		<label>
			data.json
			<textarea
				class="body"
				bind:value={raw}
				placeholder={'[\n  { "slug": "fbise9math-ex6.6-q01-i", "body": { "version": "deck-v2", "deck": [ … ] } }\n]'}
				spellcheck="false"
				required
			></textarea>
			<small class="hint">
				Shape: <code>[ {"{"} slug, body {"}"}, … ]</code> — body is the deck object
				(<code>{"{"} version, background, audio, deck: [ … ] {"}"}</code>).
				Replaces the body of each existing deck; nothing else is changed.
			</small>
		</label>

		<button type="submit" disabled={saving}>
			{saving ? progress : "Bulk Update"}
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

		{#if courseSlug}
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
		min-height: 320px;
		font-family: monospace;
		font-size: .85rem;
	}

	.hint {
		font-weight: 400;
		font-size: .8rem;
		opacity: .7;
	}

	.hint code {
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