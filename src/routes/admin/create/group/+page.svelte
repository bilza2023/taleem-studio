<script>
///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/create/group/+page.svelte
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	const courseSlug = page.url.searchParams.get("course");

	let message = $state(courseSlug ? "" : "Error: course is required");
	let saving = $state(false);

	let form = $state({
		slug: "",
		title: ""
	});

	async function submit() {
		message = "Saving...";
		saving = true;

		try {
			await send("group", "create", {
				courseSlug,
				slug: form.slug,
				title: form.title
			});

			goto(`${config.basePath}/admin/lessons?course=${encodeURIComponent(courseSlug)}`);
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			saving = false;
		}
	}
</script>

<div class="page">
	<h1>New Group</h1>

	<div class="identity">
		<div><strong>Course:</strong> {courseSlug}</div>
	</div>

	<form onsubmit={(e) => { e.preventDefault(); submit(); }}>

		<label>
			Slug
			<input bind:value={form.slug} required>
		</label>

		<label>
			Title
			<input bind:value={form.title} required>
		</label>

		<button type="submit" disabled={saving}>
			{saving ? "Saving..." : "Create Group"}
		</button>

	</form>

	{#if message}
		<p class="message">{message}</p>
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

	input {
		box-sizing: border-box;
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #bbb;
		border-radius: 5px;
		font: inherit;
		font-weight: 400;
		background: white;
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
</style>