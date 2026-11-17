<!-- /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/super/course/+page.svelte -->
<script>
	// Super admin: create / edit / open-close / delete courses.
	import { onMount } from "svelte";
	import { send } from "$lib/send/index.js";

	const ACCESS = [
		{ key: "OPEN", label: "Open", hint: "Anyone can watch every lesson." },
		{ key: "MEMBERS", label: "Members", hint: "Logged-in students only." },
		{ key: "SUBSCRIPTION", label: "Subscription", hint: "Paid: only students with an active subscription (samples stay open)." }
	];

	let courses = $state([]);
	let selected = $state(null); // course being edited, null = new
	let loading = $state(true);
	let saving = $state(false);
	let error = $state("");
	let msg = $state("");

	// form
	let slug = $state("");
	let title = $state("");
	let description = $state("");
	let access = $state("OPEN");
	let isActive = $state(true);
	let thumbnail = $state("");

	const accessHint = $derived(ACCESS.find((a) => a.key === access)?.hint ?? "");

	async function loadAll() {
		loading = true;
		try {
			courses = await send("course", "list", {});
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	onMount(loadAll);

	function fill(c) {
		slug = c?.slug ?? "";
		title = c?.title ?? "";
		description = c?.description ?? "";
		access = c?.access ?? "OPEN";
		isActive = c?.isActive ?? true;
		thumbnail = c?.thumbnail ?? "";
	}

	function selectCourse(c) {
		selected = c;
		fill(c);
		error = "";
		msg = "";
	}

	function newCourse() {
		selected = null;
		fill(null);
		error = "";
		msg = "";
	}

	async function saveCourse(e) {
		e.preventDefault();
		error = "";
		msg = "";

		if (!selected && (!slug.trim() || !title.trim())) {
			error = "Slug and title are required.";
			return;
		}

		saving = true;
		try {
			const fields = {
				title: title.trim(),
				description: description.trim(),
				access,
				isActive,
				thumbnail: thumbnail.trim()
			};

			let saved;
			if (selected) {
				saved = await send("course", "update", { slug: selected.slug, changes: fields });
				msg = "Saved.";
			} else {
				saved = await send("course", "create", { slug: slug.trim(), ...fields });
				msg = "Course created.";
			}

			await loadAll();
			const fresh = courses.find((c) => c.slug === (saved?.slug ?? selected?.slug ?? slug.trim()));
			if (fresh) selectCourse(fresh);
			msg = msg; // keep message after reselect
		} catch (err) {
			error = err.message;
		} finally {
			saving = false;
		}
	}

	async function deleteCourse() {
		if (!selected) return;
		if (!confirm(`Delete course "${selected.title}" (${selected.slug})?\nThis cannot be undone.`)) return;
		try {
			await send("course", "delete", { slug: selected.slug });
			await loadAll();
			newCourse();
			msg = "Course deleted.";
		} catch (err) {
			error = err.message; // 409/Restrict if it still has groups, lessons or subscriptions
		}
	}
</script>

<main class="page">
	<header class="top">
		<h1>📚 Courses</h1>
		<button type="button" onclick={newCourse}>+ New course</button>
	</header>

	<div class="layout">
		<!-- list -->
		<section class="list">
			{#if loading}
				<p class="muted">Loading…</p>
			{:else if courses.length === 0}
				<p class="muted">No courses yet.</p>
			{:else}
				{#each courses as c (c.slug)}
					<button
						type="button"
						class="course"
						class:active={selected?.slug === c.slug}
						class:inactive={!c.isActive}
						onclick={() => selectCourse(c)}
					>
						<span class="title">{c.title}</span>
						<span class="slug">{c.slug}</span>
						<span class="badges">
							<span class="badge {String(c.access).toLowerCase()}">{c.access}</span>
							{#if !c.isActive}<span class="badge off">HIDDEN</span>{/if}
						</span>
					</button>
				{/each}
			{/if}
		</section>

		<!-- form -->
		<form class="card form" onsubmit={saveCourse}>
			<h2>{selected ? `Edit: ${selected.title}` : "New course"}</h2>

			<label>
				Slug
				<input type="text" bind:value={slug} disabled={!!selected} placeholder="fbise9math" />
				{#if selected}<small>Slug can't change; lessons, groups and subscriptions point to it.</small>{/if}
			</label>

			<label>
				Title
				<input type="text" bind:value={title} placeholder="Class 9th Math Federal Board" />
			</label>

			<label>
				Description
				<textarea bind:value={description} rows="3"></textarea>
			</label>

			<fieldset>
				<legend>Access</legend>
				<div class="seg">
					{#each ACCESS as a (a.key)}
						<button
							type="button"
							class="seg-btn"
							class:on={access === a.key}
							aria-pressed={access === a.key}
							onclick={() => (access = a.key)}
						>{a.label}</button>
					{/each}
				</div>
				<small>{accessHint}</small>
			</fieldset>

			<label class="toggle">
				<input type="checkbox" bind:checked={isActive} />
				<span>
					<strong>{isActive ? "Visible" : "Hidden"}</strong>
					<small>{isActive ? "Listed on the site." : "Not listed for students."}</small>
				</span>
			</label>

			<label>
				Thumbnail
				<input type="text" bind:value={thumbnail} placeholder="taleem.webp" />
			</label>

			<div class="actions">
				{#if error}<span class="error">{error}</span>{/if}
				{#if msg}<span class="ok">{msg}</span>{/if}
				{#if selected}
					<button type="button" class="danger" onclick={deleteCourse}>Delete</button>
				{/if}
				<button type="submit" disabled={saving}>
					{saving ? "Saving…" : selected ? "Save changes" : "Create course"}
				</button>
			</div>
		</form>
	</div>
</main>

<style>
	.page { width: min(95vw, 1200px); margin: 0 auto; padding: 2rem 1rem; box-sizing: border-box; color: var(--theme-text); }
	.top { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.25rem; }
	h1 { margin: 0; }
	h2 { margin: 0 0 1.25rem; font-size: 1.15rem; }
	.muted { opacity: .65; }
	.error { color: #f87171; font-size: .9rem; }
	.ok { color: #6ee7b7; font-size: .9rem; }
	small { font-size: .78rem; font-weight: 400; opacity: .6; }

	.layout { display: grid; grid-template-columns: 340px 1fr; gap: 1.5rem; align-items: start; }

	/* list */
	.list { display: grid; gap: .5rem; }
	.course {
		all: unset;
		box-sizing: border-box;
		cursor: pointer;
		display: grid;
		gap: .2rem;
		padding: .8rem 1rem;
		border: 1px solid var(--theme-border);
		border-radius: 12px;
		background: var(--theme-panel);
	}
	.course:hover { border-color: var(--theme-accent); }
	.course.active { border-color: var(--theme-accent); box-shadow: 0 0 0 1px var(--theme-accent); }
	.course.inactive .title { opacity: .55; }
	.title { font-weight: 600; }
	.slug { font-size: .78rem; opacity: .55; font-family: monospace; }
	.badges { display: flex; gap: .35rem; margin-top: .25rem; }

	.badge { font-size: .65rem; font-weight: 700; padding: .12rem .5rem; border-radius: 999px; letter-spacing: .04em; }
	.badge.open { background: #064e3b; color: #6ee7b7; }
	.badge.members { background: #1e3a5f; color: #93c5fd; }
	.badge.subscription { background: #3a2c0a; color: #fcd34d; }
	.badge.off { background: #334155; color: #cbd5e1; }

	/* form */
	.card { padding: 1.25rem 1.5rem; border: 1px solid var(--theme-border); border-radius: 14px; background: var(--theme-panel); }
	label, fieldset { display: grid; gap: .4rem; margin: 0 0 1.1rem; font-size: .9rem; font-weight: 600; }
	fieldset { border: 0; padding: 0; }
	legend { padding: 0; margin-bottom: .4rem; }

	input[type="text"], textarea {
		box-sizing: border-box; width: 100%; margin: 0; padding: .6rem .75rem;
		border: 1px solid var(--theme-border); border-radius: 8px;
		background: var(--theme-panel); color: var(--theme-text); font: inherit; font-weight: 400;
	}
	input:disabled { opacity: .55; }
	textarea { resize: vertical; }

	.seg { display: flex; gap: .4rem; flex-wrap: wrap; }
	.seg-btn {
		all: unset; cursor: pointer; padding: .45rem 1rem; border-radius: 999px;
		border: 1px solid var(--theme-border); font-size: .85rem; font-weight: 500;
	}
	.seg-btn.on { background: var(--theme-accent); border-color: var(--theme-accent); color: #fff; }

	.toggle { display: flex; align-items: center; gap: .75rem; }
	.toggle input { width: 1.15rem; height: 1.15rem; margin: 0; }
	.toggle span { display: grid; gap: .1rem; }

	.actions { display: flex; justify-content: flex-end; align-items: center; gap: .6rem; flex-wrap: wrap; margin-top: .5rem; }
	button { width: auto; margin: 0; padding: .55rem 1.1rem; border: 0; border-radius: 6px; background: var(--theme-accent); color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
	button:disabled { opacity: .5; cursor: default; }
	button.danger { background: transparent; border: 1px solid #7f1d1d; color: #f87171; }

	@media (max-width: 860px) {
		.layout { grid-template-columns: 1fr; }
	}
</style>