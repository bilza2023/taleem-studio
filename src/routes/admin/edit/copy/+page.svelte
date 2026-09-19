<script>
// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/edit/copy/+page.svelte

	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { send } from "$lib/send";
	import { config } from "$lib/config.js";

	let sourceSlug = $state("");
	let originalCourse = $state("");
	let originalGroup = $state("");

	let item = $state(null);
	let courses = $state([]);
	let groups = $state([]);

	let selectedCourse = $state("");
	let selectedGroup = $state("");
	let newSlug = $state("");

	let loading = $state(true);
	let groupsLoading = $state(false);
	let saving = $state(false);
	let error = $state("");

	const trimmedSlug = $derived(newSlug.trim());

	const canSubmit = $derived(
		trimmedSlug.length > 0 &&
		trimmedSlug !== sourceSlug &&
		!!selectedCourse &&
		!!selectedGroup &&
		!saving &&
		!groupsLoading
	);

	async function loadGroups(courseSlug) {
		groupsLoading = true;

		try {
			groups = await send("group", "list", { courseSlug });

		} catch (e) {
			error = e.message;
			groups = [];

		} finally {
			groupsLoading = false;
		}
	}

	async function init() {
		sourceSlug = page.url.searchParams.get("slug") || "";
		originalCourse = page.url.searchParams.get("course") || "";
		originalGroup = page.url.searchParams.get("group") || "";

		if (!sourceSlug || !originalCourse || !originalGroup) {
			error = "Missing slug, course or group in URL.";
			loading = false;
			return;
		}

		selectedCourse = originalCourse;
		selectedGroup = originalGroup;

		try {
			const [itemData, courseList] = await Promise.all([
				send("adminLibrary", "get", { slug: sourceSlug }),
				send("course", "list", {})
			]);

			item = itemData;
			courses = courseList;

			await loadGroups(originalCourse);

		} catch (e) {
			error = e.message;

		} finally {
			loading = false;
		}
	}

	async function onCourseChange(event) {
		selectedCourse = event.currentTarget.value;
		selectedGroup = "";

		await loadGroups(selectedCourse);
	}

	function onGroupChange(event) {
		selectedGroup = event.currentTarget.value;
	}


		async function submitCopy() {
		if (!canSubmit) return;

		const courseTitle =
			courses.find(c => c.slug === selectedCourse)?.title || selectedCourse;

		const groupTitle =
			groups.find(g => g.slug === selectedGroup)?.title || selectedGroup;

		if (!confirm(`Create copy "${trimmedSlug}" in ${courseTitle} / ${groupTitle}?`)) {
			return;
		}

		saving = true;
		error = "";

		try {
			await send("adminLibrary", "create", {
				slug: trimmedSlug,
				title: item.title,
				description: item.description,
				thumbnail: item.thumbnail,
				type: item.type,
				body: item.body,
				status: "DRAFT",
				courseSlug: selectedCourse,
				groupSlug: selectedGroup,
				allowCommunication: item.allowCommunication
			});

			goto(
				`${config.basePath}/admin/edit/content` +
				`?course=${encodeURIComponent(selectedCourse)}` +
				`&group=${encodeURIComponent(selectedGroup)}` +
				`&slug=${encodeURIComponent(trimmedSlug)}`
			);

		} catch (e) {
			error = e.message;
			saving = false;
		}
	}

	init();
</script>

<div class="page">
	<h1>Copy</h1>

	{#if loading}
		<p>Loading...</p>
	{:else if error && !item}
		<p class="error">{error}</p>
	{:else}
		<div class="item-summary">
			<strong>{item?.title || sourceSlug}</strong>
			<span>{sourceSlug} · {item?.type}</span>
			<span class="current">
				Currently in: {originalCourse} / {originalGroup}
			</span>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<label>
			New slug
			<input
				type="text"
				bind:value={newSlug}
				placeholder="e.g. {sourceSlug}-2"
				disabled={saving}
			/>
		</label>

		<label>
			Course
			<select value={selectedCourse} onchange={onCourseChange} disabled={saving}>
				<option value="" disabled>Select a course</option>
				{#each courses as c}
					<option value={c.slug}>{c.title}</option>
				{/each}
			</select>
		</label>

		<label>
			Group
			<select
				value={selectedGroup}
				onchange={onGroupChange}
				disabled={saving || groupsLoading || !selectedCourse}
			>
				<option value="" disabled>
					{groupsLoading ? "Loading groups..." : "Select a group"}
				</option>
				{#each groups as g}
					<option value={g.slug}>{g.title}</option>
				{/each}
			</select>
		</label>

		<button class="submit" onclick={submitCopy} disabled={!canSubmit}>
			{saving ? "Copying..." : "Create Copy"}
		</button>
	{/if}
</div>

<style>
.page {
	max-width: 480px;
	margin: 60px auto;
	padding: 0 24px;
	color: aliceblue;
	font-family: system-ui, sans-serif;
}

.item-summary {
	display: grid;
	gap: 4px;
	margin-bottom: 24px;
	padding: 14px;
	border: 1px solid #444;
	border-radius: 7px;
	background: #181818;
}

.item-summary span {
	opacity: .7;
	font-size: .9rem;
}

.current {
	margin-top: 4px;
}

label {
	display: grid;
	gap: 6px;
	margin-bottom: 18px;
	font-size: .9rem;
	opacity: .85;
}

input,
select {
	padding: .65rem .8rem;
	background: var(--theme-panel, #181818);
	color: var(--theme-text, aliceblue);
	border: 1px solid var(--theme-border, #444);
	border-radius: 7px;
	font-size: 1rem;
}

select:disabled,
input:disabled {
	opacity: .5;
	cursor: default;
}

.submit {
	width: 100%;
	padding: 10px 12px;
	margin-top: 8px;
	border: 0;
	border-radius: 6px;
	background: #2563eb;
	color: white;
	font-size: 1rem;
	cursor: pointer;
}

.submit:hover:not(:disabled) {
	background: #1d4ed8;
}

.submit:disabled {
	opacity: .5;
	cursor: default;
}

.error {
	color: #ff7777;
}
</style>