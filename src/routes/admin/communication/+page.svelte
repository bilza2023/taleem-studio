<script>
///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/admin/communication/+page.svelte
	import { page } from "$app/state";
	import { send } from "$lib/send";

	let communications = $state([]);
	let loading = $state(true);
	let error = $state("");
	let savingId = $state(null);

	const courseSlug = page.url.searchParams.get("course");

	async function load() {
		loading = true;
		error = "";

		try {
		communications = await send("adminCommunication", "listUnanswered", { courseSlug });
		}
		catch (err) {
			console.error(err);
			error = err.message;
		}
		finally {
			loading = false;
		}
	}

	async function respond(c, authorResponse, isPublic) {
		savingId = c.id;

		try {
			const updated = await send("adminCommunication", "respond", {
				id: c.id,
				authorResponse,
				isPublic
			});

			communications = communications.map(item =>
				item.id === c.id ? updated : item
			);
		}
		catch (err) {
			console.error(err);
			alert(err.message);
		}
		finally {
			savingId = null;
		}
	}

	function formatDate(date) {
		return new Date(date).toLocaleString();
	}

	$effect(() => {
		if (courseSlug) load();
	});
</script>

{#if !courseSlug}

	<main class="feed">
		<h1>Communications</h1>
		<p>Course is required in the URL, e.g. ?course=fbise9math</p>
	</main>

{:else if loading}

	<main class="feed">
		<h1>Communications</h1>
		<p>Loading...</p>
	</main>

{:else if error}

	<main class="feed">
		<h1>Communications</h1>
		<p>{error}</p>
	</main>

{:else}

<main class="feed">

	<h1>💬 Communications</h1>

	<p class="subtitle">
		All questions and comments for <strong>{courseSlug}</strong>.
	</p>

	{#if communications.length === 0}

		<article class="card">
			No messages yet for this course.
		</article>

	{:else}

		{#each communications as c}

			<article class="card">

				<div class="header">

					<div>
						<div class="lesson">
							📘 {c.librarySlug}
						</div>
						<div class="user">
							👤 {c.user?.email ?? c.userId}
						</div>
					</div>

					<div class="time">
						{formatDate(c.createdAt)}
					</div>

				</div>

				<div class="message">
					{c.message}
				</div>

				<label class="reply-label">
					Reply
					<textarea
						class="reply-input"
						value={c.authorResponse ?? ""}
						oninput={(e) => c.authorResponse = e.currentTarget.value}
					></textarea>
				</label>

				<div class="actions">

					<label class="check">
						<input
							type="checkbox"
							checked={c.isPublic}
							onchange={(e) => c.isPublic = e.currentTarget.checked}
						>
						Make public
					</label>

					<button
						disabled={savingId === c.id}
						onclick={() => respond(c, c.authorResponse, c.isPublic)}
					>
						{savingId === c.id ? "Saving..." : "Save Reply"}
					</button>

				</div>

			</article>

		{/each}

	{/if}

</main>

{/if}

<style>
	.feed {
		width: min(95vw, 900px);
		min-height: 100vh;
		margin: 0 auto;
		padding: 2rem 1rem;
		box-sizing: border-box;
		background: var(--theme-panel);
		color: var(--theme-text);
	}

	h1 {
		margin-top: 0;
		color: var(--theme-text);
	}

	.subtitle {
		margin-bottom: 2rem;
		color: var(--theme-text);
		opacity: .7;
	}

	.card {
		margin-bottom: 1rem;
		padding: 1rem;
		border: 1px solid var(--theme-border);
		border-radius: 14px;
		background: var(--theme-panel);
		color: var(--theme-text);
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.lesson {
		font-weight: 700;
		word-break: break-word;
	}

	.user {
		font-size: .85rem;
		opacity: .75;
		margin-top: .2rem;
	}

	.time {
		font-size: .85rem;
		opacity: .7;
		white-space: nowrap;
	}

	.message {
		line-height: 1.7;
		margin-bottom: 1rem;
		white-space: pre-wrap;
	}

	.reply-label {
		display: grid;
		gap: .4rem;
		font-weight: 600;
		font-size: .85rem;
		margin-bottom: .75rem;
	}

	.reply-input {
		box-sizing: border-box;
		width: 100%;
		min-height: 90px;
		padding: .6rem .75rem;
		border: 1px solid var(--theme-border);
		border-radius: 8px;
		background: var(--theme-panel);
		color: var(--theme-text);
		font: inherit;
		resize: vertical;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.check {
		display: flex;
		align-items: center;
		gap: .5rem;
		font-size: .9rem;
		font-weight: 400;
	}

	.check input { width: auto; }

	button {
		padding: .5rem 1rem;
		border: 0;
		border-radius: 6px;
		background: var(--theme-accent);
		color: var(--theme-text);
		font: inherit;
		cursor: pointer;
	}

	button:disabled { opacity: .5; cursor: default; }

	@media (max-width: 600px) {
		.feed {
			padding: 1.25rem .75rem;
		}

		.header {
			flex-direction: column;
			gap: .4rem;
		}

		.actions {
			flex-direction: column;
			align-items: stretch;
		}
	}
</style>