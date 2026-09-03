
<!-- /home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/super/course/+page.svelte -->

<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send/index.js";

	let courses = $state([]);
	let selected = $state(null);
	let authorized = $state(null);
	let error = $state("");
	let loading = $state(true);

	let slug = $state("");
	let title = $state("");
	let description = $state("");
	let access = $state("OPEN");
	let isActive = $state(true);
	let thumbnail = $state("");

	async function loadAll() {
		try {
			courses = await send("course", "list", {});
			authorized = true;
		} catch (err) {
			authorized = false;
			error = err.message;
		} finally {
			loading = false;
		}
	}

	onMount(loadAll);

	function selectCourse(course) {
		selected = course;
		slug = course.slug;
		title = course.title;
		description = course.description || "";
		access = course.access;
		isActive = course.isActive;
		thumbnail = course.thumbnail || "";
	}

	function newCourse() {
		selected = null;
		slug = "";
		title = "";
		description = "";
		access = "OPEN";
		isActive = true;
		thumbnail = "";
	}

	async function saveCourse() {
		error = "";

		try {
			if (selected) {
				const data = { title, description, access, isActive, thumbnail };
				await send("course", "update", { slug: selected.slug, data });
			} else {
				if (!slug || !title) {
					error = "Slug and title are required.";
					return;
				}

				await send("course", "create", { slug, title, description, access, isActive, thumbnail });
			}

			await loadAll();
			newCourse();
		} catch (err) {
			error = err.message;
		}
	}

	async function deleteCourse() {
		if (!selected) return;
		if (!confirm(`Delete course ${selected.slug}?`)) return;

		try {
			await send("course", "delete", { slug: selected.slug });
			await loadAll();
			newCourse();
		} catch (err) {
			error = err.message;
		}
	}
</script>

{#if loading}
	<main class="container">
		<p>Loading…</p>
	</main>
{:else if authorized === false}
	<main class="container">
		<h2>Access denied</h2>
		<p>{error}</p>
	</main>
{:else}
	<main class="container">
		<h2>Super admin — courses</h2>

		{#if error}<p style="color:red">{error}</p>{/if}

		<div class="grid">
			<section>
				<h3>Courses</h3>
				<button onclick={newCourse}>+ New course</button>
				<ul>
					{#each courses as course}
						<li>
							<button class="link" onclick={() => selectCourse(course)}>
								{course.title} ({course.slug}){course.isActive ? "" : " — inactive"}
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<h3>{selected ? "Edit course" : "New course"}</h3>

				<label>
					Slug
					<input type="text" bind:value={slug} disabled={!!selected} />
				</label>

				<label>
					Title
					<input type="text" bind:value={title} />
				</label>

				<label>
					Description
					<textarea bind:value={description} rows="3"></textarea>
				</label>

				<label>
					Access
					<select bind:value={access}>
						<option value="OPEN">Open</option>
						<option value="MEMBERS">Members</option>
						<option value="SUBSCRIPTION">Subscription</option>
					</select>
				</label>

				<label>
					Thumbnail
					<input type="text" bind:value={thumbnail} placeholder="taleem.webp" />
				</label>

				<label>
					<input type="checkbox" bind:checked={isActive} />
					Active
				</label>

				<button onclick={saveCourse}>{selected ? "Save" : "Create"}</button>
				{#if selected}
					<button onclick={deleteCourse} class="secondary">Delete</button>
				{/if}
			</section>
		</div>
	</main>
{/if}

<style>
	.container {
		max-width: 1500px;
		margin: 0 auto;
		padding: 2rem 3rem;
		color: var(--theme-text);
		font-size: 1.15rem;
	}

	h2 {
		font-size: 2rem;
	}

	h3 {
		font-size: 1.4rem;
	}

	.grid {
		display: grid;
		grid-template-columns: 380px 1fr;
		gap: 3rem;
		margin-top: 2rem;
	}

	section {
		background: var(--theme-panel);
		border: 1px solid var(--theme-border);
		border-radius: 10px;
		padding: 1.75rem 2rem;
	}

	section h3 {
		margin-top: 0;
		font-weight: 700;
	}

	ul {
		list-style: none;
		padding: 0;
		margin: 1rem 0 0;
	}

	li {
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--theme-border);
		font-size: 1.15rem;
	}

	li:last-child {
		border-bottom: none;
	}

	button.link {
		background: none;
		border: none;
		color: var(--theme-text);
		text-decoration: none;
		display: block;
		font-weight: 600;
		font-size: inherit;
		padding: 0;
		text-align: left;
		cursor: pointer;
		width: 100%;
	}

	button.link:hover {
		color: var(--theme-accent);
	}

	label {
		display: block;
		margin-bottom: 1.4rem;
		font-size: 1.05rem;
		font-weight: 600;
	}

	input[type="text"],
	select,
	textarea {
		width: 100%;
		margin-top: 0.4rem;
		background: var(--theme-panel);
		color: var(--theme-text);
		border: 2px solid var(--theme-border);
		border-radius: 6px;
		padding: 0.9rem 1rem;
		font-size: 1.1rem;
		box-sizing: border-box;
		font-family: inherit;
	}

	label:has(input[type="checkbox"]) {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 500;
	}

	label:has(input[type="checkbox"]) input {
		width: auto;
		transform: scale(1.3);
	}

	button {
		margin-top: 0.75rem;
		margin-right: 0.75rem;
		font-size: 1.1rem;
		font-weight: 700;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
	}

	button.secondary {
		background: transparent;
		border: 2px solid var(--theme-border);
		color: var(--theme-text);
	}

	@media (max-width: 900px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>