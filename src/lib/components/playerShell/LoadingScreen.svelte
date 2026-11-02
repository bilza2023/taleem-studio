<script>
	// /src/lib/components/playerShell/LoadingScreen.svelte
	let { progress = null, error = null } = $props();

	const percent = (loaded, total) =>
		Math.min(100, Math.round((loaded / total) * 100));

	const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
</script>

<div class="status" class:error>
	{#if error}
		<p>Could not load lesson</p>
		<p class="detail">{error}</p>
	{:else}
		<p>Loading lesson…</p>

		{#if progress?.audio.loaded || progress?.audio.total}
			<p class="detail">
				Audio
				{progress.audio.total
					? `${percent(progress.audio.loaded, progress.audio.total)}%`
					: `${mb(progress.audio.loaded)} MB`}
			</p>
		{/if}

		{#if progress?.images.total}
			<p class="detail">Images {progress.images.done} / {progress.images.total}</p>
		{/if}
	{/if}
</div>

<style>
	.status {
		min-height: 60vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-family: monospace;
	}

	.status p {
		margin: 0.25rem 0;
	}

	.detail {
		opacity: 0.7;
		white-space: pre-line;
	}

	.error {
		color: #f87171;
	}
</style>