<script>
	// /home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/admin/edit/editor/+page.svelte

	import { page } from "$app/state";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";
	import Editor from "$lib/editor/Editor.svelte";
import { patchDeckV2 } from "$lib/editor/js/patchDeckV2.js";
	let item = $state(null);
	let deck = $state({ deck: [] });

	let message = $state("Loading...");
	let loading = $state(true);

	async function load() {
		try {
			const course = page.url.searchParams.get("course");
			const group = page.url.searchParams.get("group");
			const slug = page.url.searchParams.get("slug");

			if (!course || !group || !slug) {
				throw new Error("Course, group and slug are required");
			}

			const data = await send("adminLibrary", "get", { slug });

			if (!data) {
				throw new Error(`"${slug}" not found`);
			}

			if (data.type !== "PLAYER") {
				throw new Error(
					`"${slug}" is a ${data.type}, not a Player. Use Edit Content instead.`
				);
			}

			item = data;

			deck = patchDeckV2(data.body ? JSON.parse(data.body) : null);

			message = "";
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		} finally {
			loading = false;
		}
	}

	async function handleExport(presentation) {
				const data = await send("adminLibrary", "update", {
			slug: item.slug,
			data: {
				title: item.title,
				description: item.description,
				thumbnail: item.thumbnail,
				body: JSON.stringify(presentation),
				type: item.type,
				status: item.status,
				sortOrder: item.sortOrder,
				allowCommunication: item.allowCommunication,
				meta: item.meta
			}
		});

		item = { ...item, body: JSON.stringify(presentation) };

		return data;
	}

	$effect(() => {
		load();
	});
</script>

<div class="page">
	{#if loading || message}

		<p class="message">{message}</p>

	{:else}

		<div class="identity">
			<div><strong>Slug:</strong> {item.slug}</div>
			<div><strong>Course:</strong> {item.courseSlug}</div>
			<div><strong>Group:</strong> {item.groupSlug}</div>
			<a
				class="back"
				href={`${config.basePath}/admin/edit/content?course=${encodeURIComponent(item.courseSlug)}&group=${encodeURIComponent(item.groupSlug)}&slug=${encodeURIComponent(item.slug)}`}
			>
				Edit
			</a>
			<a
				class="back"
			href={`${config.basePath}/admin/player?lesson=${encodeURIComponent(item.slug)}`}
			>
				Play
			</a>
		</div>

		<Editor bind:deck onExport={handleExport} />

	{/if}
</div>

<style>
	.page {
		width: 100%;
		color: aliceblue;
		font-family: system-ui, sans-serif;
	}

	.identity {
		margin-bottom: 10px;
		padding: 12px;
		background: #01310d;
		border: 1px solid #333;
		border-radius: 6px;
		display: flex;
		align-items: center;
		gap: 20px;
		font-size: .9rem;
	}

	.identity a.back {
		margin-left: 0;
		display: inline-flex;
		align-items: center;
		padding: 6px 14px;
		border-radius: 6px;
		border: 1px solid #3a5a4a;
		background: #0d3d1c;
		color: #5fa8ff;
		text-decoration: none;
		font-size: .85rem;
		font-weight: 600;
		line-height: 1;
		transition: background .15s ease, transform .1s ease;
	}

	.identity a.back:first-of-type {
		margin-left: auto;
	}

	.identity a.back:hover {
		background: #145229;
		transform: translateY(-1px);
	}

	.message {
		max-width: 800px;
		margin: 40px auto;
		padding: 12px;
		background: #eee;
		color: #222;
		border-radius: 5px;
	}
</style>