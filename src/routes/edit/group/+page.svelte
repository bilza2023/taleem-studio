<script>
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";

	const params = new URLSearchParams(location.search);
	const courseSlug = params.get("course");
	let groupSlug = params.get("group");
	const isNew = !groupSlug;

	let form = $state({ slug: "", title: "", description: "", thumbnail: "" });
	let message = $state(courseSlug ? "" : "Missing course slug");

	onMount(async () => {
		if (isNew || !courseSlug) return;

		try {
			const data = await send("group", "get", { courseSlug, groupSlug });
			form = { ...form, ...data };
		} catch (error) {
			message = `Error: ${error.message}`;
		}
	});

	async function submit() {
		message = "Saving...";

		try {
			if (isNew) {
				const data = await send("group", "create", { ...form, courseSlug });
				groupSlug = data.slug;
				message = `Created: ${data.slug}`;
			} else {
				const data = await send("group", "update", { courseSlug, groupSlug, data: form });
				form = { ...form, ...data };
				message = `Updated: ${data.slug}`;
			}
		} catch (error) {
			message = `Error: ${error.message}`;
		}
	}

	async function remove() {
		if (!confirm(`Delete group "${groupSlug}"? This cannot be undone.`)) return;

		message = "Deleting...";

		try {
			await send("group", "delete", { courseSlug, groupSlug });
			goto(`/groups?course=${encodeURIComponent(courseSlug)}`);
		} catch (error) {
			message = `Error: ${error.message}`;
		}
	}
</script>

<div class="page">
	<h1>{isNew ? "New Group" : "Edit Group"}</h1>

	<form onsubmit={(e) => { e.preventDefault(); submit(); }}>
		<label>
			Slug
			<input bind:value={form.slug} disabled={!isNew} required>
		</label>

		<label>
			Title
			<input bind:value={form.title} required>
		</label>

		<label>
			Description
			<textarea bind:value={form.description}></textarea>
		</label>

		<label>
			Thumbnail
			<input bind:value={form.thumbnail}>
		</label>

		<button type="submit">{isNew ? "Create Group" : "Update Group"}</button>
	</form>

	{#if !isNew}
		<button class="danger" onclick={remove}>Delete Group</button>
	{/if}

	{#if message}
		<p class="message">{message}</p>
	{/if}
</div>

<style>
	.page { max-width: 800px; color: aliceblue; margin: 40px auto; padding: 0 24px; font-family: system-ui, sans-serif; }
	h1 { margin-bottom: 30px; }
	form { display: grid; gap: 18px; }
	label { display: grid; gap: 6px; font-weight: 600; }
	input, textarea { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 1px solid #bbb; border-radius: 5px; font: inherit; font-weight: 400; background: white; }
	textarea { min-height: 90px; resize: vertical; }
	button { width: fit-content; padding: 10px 20px; border: 0; border-radius: 5px; background: #222; color: white; font: inherit; cursor: pointer; }
	button:hover { background: #444; }
	button.danger { background: #7a1f1f; margin-top: 20px; }
	button.danger:hover { background: #a32828; }
	.message { margin-top: 20px; padding: 12px; background: #eee; color: #222; border-radius: 5px; }
</style>