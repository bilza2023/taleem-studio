<script>
///home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/sort-groups/+page.svelte

	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	const courseSlug = page.url.searchParams.get("course");

	let groups = $state([]);
	let raw = $state("");
	let message = $state(courseSlug ? "" : "Error: course is required");
	let loading = $state(true);
	let saving = $state(false);

	function fillTextarea() {
		raw = groups.map((g) => g.slug).join("\n");
	}

	async function loadGroups() {
		try {
			groups = await send("group", "list", { courseSlug });
			fillTextarea();
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			loading = false;
		}
	}

	// One slug per line. Also tolerates a pasted JSON array:
	// strips [ ] , and quotes from each line.
	function parseSlugs() {
		return raw
			.split("\n")
			.map((line) => line.trim().replace(/^[\[\s"']+|[\]\s"',]+$/g, ""))
			.filter(Boolean);
	}

	function validate(slugs) {
		const known = new Set(groups.map((g) => g.slug));
		const errors = [];

		const missing = [...known].filter((s) => !slugs.includes(s));
		const unknown = slugs.filter((s) => !known.has(s));
		const dupes = [...new Set(slugs.filter((s, i) => slugs.indexOf(s) !== i))];

		if (missing.length) errors.push(`missing: ${missing.join(", ")}`);
		if (unknown.length) errors.push(`not in course: ${unknown.join(", ")}`);
		if (dupes.length) errors.push(`duplicated: ${dupes.join(", ")}`);

		return errors;
	}

	async function submit() {
		const slugs = parseSlugs();
		const errors = validate(slugs);

		if (errors.length) {
			message = `Error: ${errors.join(" · ")}`;
			return;
		}

		message = "";
		saving = true;

		try {
			groups = await send("group", "reorder", { courseSlug, slugs });
			fillTextarea();
			message = `Done — ${groups.length} groups reordered.`;
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			saving = false;
		}
	}

	function reset() {
		fillTextarea();
		message = "";
	}

	function goToGroups() {
		goto(`${config.basePath}/admin/groups?course=${encodeURIComponent(courseSlug)}`);
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

		<h1>Sort Groups</h1>

		<div class="identity">
			<div><strong>Course:</strong> {courseSlug}</div>
			<div><strong>Groups:</strong> {groups.length}</div>
		</div>

		<div class="columns">

			<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
				<label>
					New order (one slug per line)
					<textarea
						class="body"
						bind:value={raw}
						spellcheck="false"
						required
					></textarea>
					<small class="hint">
						Move lines into the order you want. Every group must appear exactly once.
					</small>
				</label>

				<div class="actions">
					<button type="submit" disabled={saving}>
						{saving ? "Saving..." : "Save Order"}
					</button>
					<button type="button" class="secondary" onclick={reset} disabled={saving}>
						Reset
					</button>
				</div>
			</form>

			<div class="current">
				<strong>Current saved order</strong>
				<ol>
					{#each groups as g}
						<li><code>{g.slug}</code> — {g.title}</li>
					{/each}
				</ol>
			</div>

		</div>

		{#if message}
			<p class="message">{message}</p>
		{/if}

		<button type="button" onclick={goToGroups}>
			Done — go to Groups
		</button>

	{/if}
</div>

<style>
	.page {
		max-width: 1000px;
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

	.columns {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 24px;
		align-items: start;
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
		min-height: 360px;
		font-family: monospace;
		line-height: 1.6;
	}

	.current {
		padding: 12px;
		background: #171717;
		border: 1px solid #333;
		border-radius: 6px;
		font-size: .9rem;
	}

	.current ol {
		margin: 10px 0 0;
		padding-left: 1.5rem;
		display: grid;
		gap: 4px;
	}

	.actions {
		display: flex;
		gap: 10px;
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
	button.secondary { background: #333; }

	.message {
		margin-top: 20px;
		padding: 12px;
		background: #eee;
		color: #222;
		border-radius: 5px;
	}

	.hint {
		font-weight: 400;
		font-size: .8rem;
		opacity: .7;
	}

	@media (max-width: 700px) {
		.columns { grid-template-columns: 1fr; }
	}
</style>
