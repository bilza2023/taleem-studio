<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/create/content/+page.svelte
	// Create ONE library item (as DRAFT). Everything else is edited afterwards.
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";

	const courseSlug = page.url.searchParams.get("course");

	const TYPES = [
		{ key: "PLAYER", label: "Deck (player)" },
		{ key: "ARTICLE", label: "Article" },
		{ key: "MCQ", label: "MCQ (beta)" }
	];

	let groups = $state([]);
	let loading = $state(true);
	let saving = $state(false);
	let error = $state(courseSlug ? "" : "No course selected. Pick one in “Working on”.");

	let title = $state("");
	let slug = $state("");
	let slugTouched = $state(false); // stop auto-filling once edited by hand
	let type = $state("PLAYER");
	let groupSlug = $state(page.url.searchParams.get("group") ?? "");

	const slugify = (s) =>
		s.toLowerCase().trim()
			.replace(/[^a-z0-9.\s-]/g, "")
			.replace(/[\s_]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");

	function onTitle() {
		if (!slugTouched) slug = slugify(title);
	}

	async function loadGroups() {
		try {
			groups = await send("group", "list", { courseSlug });
			if (!groups.some((g) => g.slug === groupSlug)) groupSlug = groups[0]?.slug ?? "";
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (courseSlug) loadGroups();
		else loading = false;
	});

	async function create(e) {
		e.preventDefault();
		error = "";

		const s = slugify(slug);
		if (!title.trim() || !s || !groupSlug) {
			error = "Title, slug and chapter are required.";
			return;
		}

		saving = true;
		try {
			await send("library", "create", {
				slug: s,
				courseSlug,
				groupSlug,
				type,
				title: title.trim(),
				status: "DRAFT"
			});
			goto(`/admin/course?course=${encodeURIComponent(courseSlug)}&group=${encodeURIComponent(groupSlug)}`);
		} catch (err) {
			error = err.message; // 409 = slug already exists
		} finally {
			saving = false;
		}
	}
</script>

<main class="page">
	<h1>➕ New lesson</h1>
	{#if courseSlug}<p class="subtitle">Course: <strong>{courseSlug}</strong> · created as a Draft</p>{/if}

	{#if loading}
		<p>Loading…</p>
	{:else if !courseSlug}
		<p class="error">{error}</p>
	{:else}
		<form class="card" onsubmit={create}>
			<label>
				Title
				<input bind:value={title} oninput={onTitle} placeholder="Exercise 4.6 — Question 1" required />
			</label>

			<label>
				Slug
				<input
					bind:value={slug}
					oninput={() => (slugTouched = true)}
					placeholder="fbise9math-ex4.6-q01"
					class="mono"
					required
				/>
				<small>Permanent ID used in links. Lowercase, numbers, dots and dashes.</small>
			</label>

			<fieldset>
				<legend>Type</legend>
				<div class="seg">
					{#each TYPES as t (t.key)}
						<button type="button" class="seg-btn" class:on={type === t.key} aria-pressed={type === t.key} onclick={() => (type = t.key)}>
							{t.label}
						</button>
					{/each}
				</div>
			</fieldset>

			<label>
				Chapter
				<select bind:value={groupSlug} required>
					{#each groups as g (g.slug)}
						<option value={g.slug}>{g.title ?? g.slug}</option>
					{/each}
				</select>
			</label>

			<div class="actions">
				{#if error}<span class="error">{error}</span>{/if}
				<button type="submit" disabled={saving}>{saving ? "Creating…" : "Create draft"}</button>
			</div>
		</form>
	{/if}
</main>

<style>
	.page { width: min(95vw, 720px); margin: 0 auto; padding: 2rem 1rem; box-sizing: border-box; color: var(--theme-text); }
	h1 { margin: 0 0 .25rem; }
	.subtitle { opacity: .7; margin: 0 0 1.25rem; }
	.error { color: #f87171; font-size: .9rem; }
	small { font-size: .78rem; font-weight: 400; opacity: .6; }

	.card { padding: 1.25rem 1.5rem; border: 1px solid var(--theme-border); border-radius: 14px; background: var(--theme-panel); }
	label, fieldset { display: grid; gap: .4rem; margin: 0 0 1.1rem; font-size: .9rem; font-weight: 600; }
	fieldset { border: 0; padding: 0; }
	legend { padding: 0; margin-bottom: .4rem; }

	input, select {
		box-sizing: border-box; width: 100%; margin: 0; padding: .6rem .75rem;
		border: 1px solid var(--theme-border); border-radius: 8px;
		background: var(--theme-panel); color: var(--theme-text); font: inherit; font-weight: 400;
	}
	.mono { font-family: monospace; }

	.seg { display: flex; gap: .4rem; flex-wrap: wrap; }
	.seg-btn { all: unset; cursor: pointer; padding: .45rem 1rem; border-radius: 999px; border: 1px solid var(--theme-border); font-size: .85rem; font-weight: 500; }
	.seg-btn.on { background: var(--theme-accent); border-color: var(--theme-accent); color: #fff; }

	.actions { display: flex; justify-content: flex-end; align-items: center; gap: .75rem; flex-wrap: wrap; }
	button[type="submit"] { width: auto; margin: 0; padding: .55rem 1.2rem; border: 0; border-radius: 6px; background: var(--theme-accent); color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
	button:disabled { opacity: .5; cursor: default; }
</style>