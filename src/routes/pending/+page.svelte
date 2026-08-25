<script>
	import { page } from "$app/state";
	import { admin } from "$lib/api/admin.js";

	let course = $state(null);
	let pending = $state([]);
	let error = $state("");
	let loading = $state(true);
	let creating = $state("");

	async function load() {
		try {
			const courseSlug = page.url.searchParams.get("course");

			if (!courseSlug) throw new Error("Course is required");

			const data = await admin.get(
				`/pending?course=${encodeURIComponent(courseSlug)}`
			);

			course = data.course;
			pending = data.pending;
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	async function createContent(role, item) {
		creating = `${item.slug}:${role}`;
		error = "";

		try {
			await admin.post(
				`/pending?course=${encodeURIComponent(course.slug)}&group=${encodeURIComponent(item.groupSlug)}&slug=${encodeURIComponent(item.slug)}&role=${encodeURIComponent(role)}`,
				{}
			);

			pending = pending.filter(p => p.slug !== item.slug);

			alert(`${role} created: ${item.slug}`);
		} catch (err) {
			console.error(err);
			error = err.message;
		} finally {
			creating = "";
		}
	}

	$effect(() => {
		load();
	});
</script>

<div class="page">
	{#if loading}
		<p>Loading...</p>

	{:else if error}
		<p class="error">{error}</p>

	{:else}
		<h1>Pending Content</h1>
		<h2>{course.title}</h2>

		<div class="summary">
			Showing {pending.length} Pending lessons
		</div>

		{#if pending.length === 0}
			<p class="empty">Everything has been created. 🎉</p>
		{:else}
			<div class="list">
				{#each pending as item}
					<div class="item">
						<div class="info">
							<strong>{item.slug}</strong>
							<small>{item.groupTitle}</small>
						</div>

						<div class="actions">
							<button
								onclick={() => createContent("ARTICLE", item)}
								disabled={creating !== "" || creating === `${item.slug}:ARTICLE`}
							>
								{creating === `${item.slug}:ARTICLE`
									? "Creating..."
									: "＋ Article"}
							</button>

							<button
								onclick={() => createContent("PLAYER", item)}
								disabled={creating !== "" || creating === `${item.slug}:PLAYER`}
							>
								{creating === `${item.slug}:PLAYER`
									? "Creating..."
									: "＋ Player"}
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>

<style>
	.page {
		max-width: 900px;
		margin: 40px auto;
		padding: 0 24px;
		color: var(--theme-text);
	}

	h1 { margin-bottom: 4px; }

	h2 {
		margin-top: 0;
		opacity: .7;
		font-size: 1rem;
	}

	.summary {
		margin-top: 18px;
		opacity: .7;
		font-size: .9rem;
	}

	.list {
		display: grid;
		gap: 8px;
		margin-top: 30px;
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border: 1px solid #333;
		border-radius: 6px;
		background: var(--theme-panel);
	}

	.info {
		display: grid;
		gap: 3px;
	}

	small {
		opacity: .6;
	}

	.actions {
		display: flex;
		gap: 8px;
	}

	button {
		color: inherit;
		background: transparent;
		padding: 6px 12px;
		border: 1px solid #555;
		border-radius: 5px;
		cursor: pointer;
	}

	button:hover {
		background: #333;
	}

	button:disabled {
		opacity: .5;
		cursor: default;
	}

	.error {
		color: #ff8f8f;
	}

	.empty {
		margin-top: 30px;
	}
</style>