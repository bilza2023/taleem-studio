<!-- /home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/super/admin/+page.svelte -->

<script>
	import { onMount } from "svelte";
	import { send } from "$lib/send/index.js";

	let admins = $state([]);
	let courses = $state([]);
	let selected = $state(null);
	let authorized = $state(null);
	let error = $state("");
	let loading = $state(true);

	let email = $state("");
	let password = $state("");
	let isActive = $state(true);

	let assignedSlugs = $derived.by(() => {
		if (!selected) return new Set();
		return new Set(JSON.parse(selected.courseSlugs || "[]"));
	});

	async function loadAll() {
		try {
			admins = await send("admin", "list", {});
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

	function selectAdmin(admin) {
		selected = admin;
		email = admin.email;
		password = "";
		isActive = admin.isActive;
	}

	function newAdmin() {
		selected = null;
		email = "";
		password = "";
		isActive = true;
	}

	async function saveAdmin() {
		error = "";

		try {
			if (selected) {
				const data = { isActive };
				if (password) data.password = password;

				await send("admin", "update", { email: selected.email, data });
			} else {
				if (!email || !password) {
					error = "Email and password are required.";
					return;
				}

				await send("admin", "create", { email, password });
			}

			await loadAll();
			newAdmin();
		} catch (err) {
			error = err.message;
		}
	}

	async function deleteAdmin() {
		if (!selected) return;
		if (!confirm(`Delete admin ${selected.email}?`)) return;

		try {
			await send("admin", "delete", { email: selected.email });
			await loadAll();
			newAdmin();
		} catch (err) {
			error = err.message;
		}
	}

	async function toggleCourse(courseSlug, checked) {
		if (!selected) return;

		try {
			if (checked) {
				await send("admin", "assignCourse", { email: selected.email, courseSlug });
			} else {
				await send("admin", "unassignCourse", { email: selected.email, courseSlug });
			}

			const refreshed = await send("admin", "get", { email: selected.email });
			selected = refreshed;
			admins = admins.map((a) => (a.email === refreshed.email ? refreshed : a));
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
		<h2>Super admin — admins</h2>

		{#if error}<p style="color:red">{error}</p>{/if}

		<div class="grid">
			<section>
				<h3>Admins</h3>
				<button onclick={newAdmin}>+ New admin</button>
				<ul>
					{#each admins as admin}
						<li>
							<button class="link" onclick={() => selectAdmin(admin)}>
								{admin.email} ({admin.role}{admin.isActive ? "" : ", inactive"})
							</button>
						</li>
					{/each}
				</ul>
			</section>

			<section>
				<h3>{selected ? "Edit admin" : "New admin"}</h3>

				<label>
					Email
					<input type="email" bind:value={email} disabled={!!selected} />
				</label>

				<label>
					Password {selected ? "(leave blank to keep unchanged)" : ""}
					<input type="password" bind:value={password} />
				</label>

				{#if selected}
					<label>
						Role: {selected.role}
						{#if selected.role === "SUPER_ADMIN"}
							<span class="hint">(super admin status is set via script, not this page)</span>
						{/if}
					</label>

					<label>
						<input type="checkbox" bind:checked={isActive} />
						Active
					</label>
				{/if}

				<button onclick={saveAdmin}>{selected ? "Save" : "Create"}</button>
				{#if selected}
					<button onclick={deleteAdmin} class="secondary">Delete</button>
				{/if}

				{#if selected}
					<h4>Courses</h4>
					{#each courses as course}
						<label>
							<input
								type="checkbox"
								checked={assignedSlugs.has(course.slug)}
								onchange={(e) => toggleCourse(course.slug, e.target.checked)}
							/>
							{course.title} ({course.slug})
						</label>
					{/each}
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

	h4 {
		font-size: 1.2rem;
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

	section h3, section h4 {
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

	.hint {
		font-weight: 400;
		font-size: 0.9rem;
		color: var(--theme-text);
		opacity: 0.7;
		display: block;
	}

	label {
		display: block;
		margin-bottom: 1.4rem;
		font-size: 1.05rem;
		font-weight: 600;
	}

	input[type="email"],
	input[type="password"] {
		width: 100%;
		margin-top: 0.4rem;
		background: var(--theme-panel);
		color: var(--theme-text);
		border: 2px solid var(--theme-border);
		border-radius: 6px;
		padding: 0.9rem 1rem;
		font-size: 1.1rem;
		box-sizing: border-box;
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