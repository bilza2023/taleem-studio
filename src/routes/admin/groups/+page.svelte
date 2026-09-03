<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	const courseSlug = new URLSearchParams(location.search).get("course");

	let groups = $state([]);
	let message = $state(courseSlug ? "" : "Missing course slug");

	onMount(async () => {
		if (!courseSlug) return;

		try {
			groups = await send("group", "list", { courseSlug });
		} catch (error) {
			message = `Error: ${error.message}`;
		}
	});
</script>

<div class="page">
	<h1>Groups</h1>

	<a class="button" href={`${config.basePath}/edit/group?course=${encodeURIComponent(courseSlug)}`}>
		+ New Group
	</a>

	{#if message}
		<p class="message">{message}</p>
	{/if}

	<ul>
		{#each groups as group (group.slug)}
			<li>
				<span class="title">{group.title}</span>
				<span class="slug">{group.slug}</span>
				<a class="button" href={`${config.basePath}/edit/group?course=${encodeURIComponent(courseSlug)}&group=${encodeURIComponent(group.slug)}`}>Edit</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	.page { max-width: 800px; margin: 40px auto; padding: 0 24px; font-family: system-ui, sans-serif; color: aliceblue; }
	h1 { margin-bottom: 20px; }
	.button { display: inline-block; padding: 8px 14px; border-radius: 5px; background: #222; color: white; text-decoration: none; margin-bottom: 20px; }
	.button:hover { background: #444; }
	ul { list-style: none; padding: 0; display: grid; gap: 12px; }
	li { display: flex; align-items: center; gap: 16px; padding: 12px; border: 1px solid #444; border-radius: 6px; }
	.title { font-weight: 600; flex: 1; }
	.slug { color: #999; font-family: monospace; }
	.message { margin: 12px 0; padding: 12px; background: #eee; color: #222; border-radius: 5px; }
</style>