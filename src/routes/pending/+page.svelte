<script>
	import { page } from "$app/state";
	import { admin } from "$lib/api/admin.js";

	let course = $state(null);
	let pending = $state([]);
	let error = $state("");
	let loading = $state(true);

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

	function editUrl(type, item) {
		return `/edit/${type}?course=${encodeURIComponent(course.slug)}&group=${encodeURIComponent(item.groupSlug)}&slug=${encodeURIComponent(item.slug)}`;
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
							<a href={editUrl("article", item)}>＋ Article</a>
							<a href={editUrl("player", item)}>＋ Player</a>
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

	a {
		color: inherit;
		text-decoration: none;
		padding: 6px 12px;
		border: 1px solid #555;
		border-radius: 5px;
	}

	a:hover {
		background: #333;
	}

	.error { color: #ff8f8f; }

	.empty { margin-top: 30px; }
</style>