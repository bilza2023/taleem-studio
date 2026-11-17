<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/lib/components/Rating.svelte
	// Student rating panel for one lesson (deck, article, …).
	// Usage: <Rating librarySlug={slug} allowed={item.allowCommunication !== false} />
	import { onMount } from "svelte";
	import { send } from "$lib/send";

	let { librarySlug, allowed = true } = $props();

	const COMMENT_MAX = 300;
	const STAR_LABELS = ["", "Poor", "Weak", "Okay", "Good", "Excellent"];

	let phase = $state("loading"); // loading | ready | login | hidden | error
	let options = $state([]);      // [{ key, label }]
	let stars = $state(0);
	let hover = $state(0);
	let picked = $state([]);       // option keys
	let comment = $state("");
	let saved = $state(null);      // last saved snapshot
	let saving = $state(false);
	let msg = $state("");
	let error = $state("");

	const snapshot = () => JSON.stringify({ stars, picked: [...picked].sort(), comment: comment.trim() });
	let dirty = $derived(saved === null ? stars > 0 : snapshot() !== saved);

	function apply(row) {
		stars = row.stars;
		picked = row.options ?? [];
		comment = row.comment ?? "";
		saved = snapshot();
	}

	const isAuthError = (err) => err?.status === 401 || /log ?in|token|unauthor/i.test(err?.message ?? "");

	onMount(async () => {
		if (!allowed || !librarySlug) {
			phase = "hidden";
			return;
		}
		try {
			options = await send("rating", "options", {});
		} catch {
			phase = "hidden";
			return;
		}
		try {
			const mine = await send("rating", "mine", { librarySlug }, "user");
			if (mine) apply(mine);
			phase = "ready";
		} catch (err) {
			if (isAuthError(err)) phase = "login";
			else {
				phase = "error";
				error = err.message;
			}
		}
	});

	function toggle(key) {
		picked = picked.includes(key) ? picked.filter((k) => k !== key) : [...picked, key];
		msg = "";
	}

	function setStars(n) {
		stars = n;
		msg = "";
	}

	async function save() {
		if (!stars) {
			error = "Pick a star rating first.";
			return;
		}
		saving = true;
		error = "";
		msg = "";
		try {
			const row = await send(
				"rating",
				"save",
				{ librarySlug, stars, options: picked, comment: comment.trim() },
				"user"
			);
			apply(row);
			msg = "Thanks! Your rating is saved. You can change it anytime.";
		} catch (err) {
			if (err?.status === 403 || err?.status === 404) phase = "hidden"; // rating off / not ratable
			else if (isAuthError(err)) phase = "login";
			else error = err.message;
		} finally {
			saving = false;
		}
	}
</script>

{#if phase !== "hidden"}
	<section class="rating">
		<header>
			<h3>Rate this lesson</h3>
			{#if saved && phase === "ready"}<span class="tag">Your rating</span>{/if}
		</header>

		{#if phase === "loading"}
			<p class="muted">Loading…</p>
		{:else if phase === "login"}
			<p class="muted">Log in to rate this lesson and tell us how to improve it.</p>
		{:else if phase === "error"}
			<p class="error">{error}</p>
		{:else}
			<!-- stars -->
			<div class="stars" role="radiogroup" aria-label="Star rating">
				{#each [1, 2, 3, 4, 5] as n (n)}
					<button
						type="button"
						class="star"
						class:on={(hover || stars) >= n}
						role="radio"
						aria-checked={stars === n}
						aria-label={`${n} star${n > 1 ? "s" : ""}`}
						onmouseenter={() => (hover = n)}
						onmouseleave={() => (hover = 0)}
						onclick={() => setStars(n)}
					>★</button>
				{/each}
				<span class="star-label">{STAR_LABELS[hover || stars] ?? ""}</span>
			</div>

			<!-- options (multi-select) -->
			{#if options.length}
				<div class="chips">
					{#each options as o (o.key)}
						<button
							type="button"
							class="chip"
							class:active={picked.includes(o.key)}
							aria-pressed={picked.includes(o.key)}
							onclick={() => toggle(o.key)}
						>{o.label}</button>
					{/each}
				</div>
			{/if}

			<!-- comment -->
			<label class="comment">
				<span>What would you like us to improve? <em>(optional)</em></span>
				<textarea
					maxlength={COMMENT_MAX}
					bind:value={comment}
					oninput={() => (msg = "")}
					placeholder="A short note helps us fix this lesson faster."
				></textarea>
				<small>{comment.length}/{COMMENT_MAX}</small>
			</label>

			<div class="actions">
				{#if error}<span class="error">{error}</span>{/if}
				{#if msg}<span class="ok">{msg}</span>{/if}
				<button type="button" class="save" disabled={saving || !dirty} onclick={save}>
					{saving ? "Saving…" : saved ? "Update rating" : "Submit rating"}
				</button>
			</div>
		{/if}
	</section>
{/if}

<style>
	.rating {
		width: min(95%, 900px);
		margin: 2rem auto 4rem;
		padding: 1.25rem 1.5rem;
		box-sizing: border-box;
		background: var(--theme-panel, #111827);
		color: var(--theme-text, #e5e7eb);
		border: 1px solid var(--theme-border, #334155);
		border-radius: 14px;
	}

	header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .75rem; }
	h3 { margin: 0; font-size: 1.1rem; }
	.tag { font-size: .7rem; font-weight: 700; padding: .15rem .55rem; border-radius: 999px; background: #064e3b; color: #6ee7b7; letter-spacing: .04em; }

	.muted { opacity: .7; margin: 0; }
	.error { color: #f87171; font-size: .85rem; }
	.ok { color: #6ee7b7; font-size: .85rem; }

	.stars { display: flex; align-items: center; gap: .15rem; margin-bottom: 1rem; }
	.star {
		all: unset;
		cursor: pointer;
		font-size: 1.9rem;
		line-height: 1;
		padding: 0 .1rem;
		color: var(--theme-border, #475569);
		transition: transform .1s, color .1s;
	}
	.star.on { color: #fbbf24; }
	.star:hover { transform: scale(1.12); }
	.star:focus-visible { outline: 2px solid var(--theme-accent, #3b82f6); border-radius: 4px; }
	.star-label { margin-left: .6rem; font-size: .85rem; opacity: .75; min-width: 5rem; }

	.chips { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
	.chip {
		all: unset;
		cursor: pointer;
		padding: .35rem .9rem;
		border-radius: 999px;
		border: 1px solid var(--theme-border, #334155);
		font-size: .85rem;
	}
	.chip.active { background: var(--theme-accent, #3b82f6); border-color: var(--theme-accent, #3b82f6); color: #fff; }
	.chip:focus-visible { outline: 2px solid var(--theme-accent, #3b82f6); }

	.comment { display: grid; gap: .4rem; font-size: .85rem; font-weight: 600; margin-bottom: .75rem; }
	.comment em { font-weight: 400; opacity: .6; font-style: normal; }
	.comment small { justify-self: end; font-weight: 400; opacity: .55; }
	textarea {
		box-sizing: border-box;
		width: 100%;
		min-height: 80px;
		margin: 0;
		padding: .6rem .75rem;
		border: 1px solid var(--theme-border, #334155);
		border-radius: 8px;
		background: transparent;
		color: inherit;
		font: inherit;
		font-weight: 400;
		resize: vertical;
	}

	.actions { display: flex; justify-content: flex-end; align-items: center; gap: .75rem; flex-wrap: wrap; }
	.save {
		width: auto;
		margin: 0;
		padding: .5rem 1.1rem;
		border: 0;
		border-radius: 6px;
		background: var(--theme-accent, #3b82f6);
		color: #fff;
		font: inherit;
		cursor: pointer;
	}
	.save:disabled { opacity: .5; cursor: default; }

	@media (max-width: 600px) {
		.rating { width: 95%; padding: 1rem; }
	}
</style>