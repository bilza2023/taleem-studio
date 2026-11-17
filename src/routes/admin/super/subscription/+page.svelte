<script>
	// /home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/super/subscription/+page.svelte
	// Super admin: grant, list and revoke course subscriptions. All rules live in subscription.grant.
	import { onMount } from "svelte";
	import { send } from "$lib/send";

	const DURATIONS = [
		{ key: "1", label: "1 month", months: 1 },
		{ key: "3", label: "3 months", months: 3 },
		{ key: "6", label: "6 months", months: 6, price: 5000 },
		{ key: "12", label: "1 year", months: 12, price: 8000 },
		{ key: "lifetime", label: "Lifetime", lifetime: true }
	];

	let courses = $state([]);

	// grant form
	let gEmail = $state("");
	let gCourse = $state("");
	let gDuration = $state("12");
	let gAmount = $state("8000");
	let granting = $state(false);
	let grantMsg = $state("");
	let grantErr = $state("");

	// list + filters
	let fEmail = $state("");
	let fCourse = $state("");
	let fActive = $state(""); // "" | "true" | "false"
	let rows = $state([]);
	let loading = $state(true);
	let error = $state("");
	let busyId = $state(null);

	const courseTitle = (slug) => courses.find((c) => c.slug === slug)?.title ?? slug;
	const when = (d) => (d ? new Date(d).toLocaleDateString() : "");

	function statusOf(s) {
		const now = new Date();
		if (s.cancelledAt) return "cancelled";
		if (new Date(s.startsAt) > now) return "upcoming";
		if (s.endsAt && new Date(s.endsAt) < now) return "expired";
		return "active";
	}

	onMount(async () => {
		try {
			courses = await send("course", "list", {});
		} catch (err) {
			error = err.message;
		}
		load();
	});

	async function load() {
		loading = true;
		error = "";
		try {
			rows = await send("subscription", "list", {
				userEmail: fEmail.trim() || undefined,
				courseSlug: fCourse || undefined,
				active: fActive === "" ? undefined : fActive === "true"
			});
		} catch (err) {
			error = err.message;
			rows = [];
		} finally {
			loading = false;
		}
	}

	function onDuration() {
		const d = DURATIONS.find((x) => x.key === gDuration);
		if (d?.price) gAmount = String(d.price);
	}

	async function grant(e) {
		e.preventDefault();
		grantMsg = "";
		grantErr = "";

		const d = DURATIONS.find((x) => x.key === gDuration);
		const input = {
			userEmail: gEmail.trim(),
			courseSlug: gCourse,
			...(d.lifetime ? { lifetime: true } : { months: d.months })
		};
		if (String(gAmount).trim() !== "") input.amount = Number(gAmount);

		granting = true;
		try {
			const s = await send("subscription", "grant", input);
			grantMsg = `Granted ${courseTitle(s.courseSlug)} to ${input.userEmail}: ${when(s.startsAt)} → ${s.endsAt ? when(s.endsAt) : "lifetime"}.`;
			fEmail = input.userEmail; // show this student's rows
			await load();
		} catch (err) {
			grantErr = err.message;
		} finally {
			granting = false;
		}
	}

	async function revoke(s) {
		if (!confirm(`Cancel ${s.user?.email ?? "this student"}'s ${courseTitle(s.courseSlug)} subscription?`)) return;
		busyId = s.id;
		try {
			await send("subscription", "revoke", { id: s.id });
			await load();
		} catch (err) {
			alert(err.message);
		} finally {
			busyId = null;
		}
	}

	function searchSubmit(e) {
		e.preventDefault();
		load();
	}

	function clearFilters() {
		fEmail = "";
		fCourse = "";
		fActive = "";
		load();
	}
</script>

<main class="page">
	<h1>💳 Subscriptions</h1>

	<!-- grant -->
	<form class="card grant" onsubmit={grant}>
		<h2>Grant a subscription</h2>

		<div class="grid">
			<label>
				Student email
				<input type="email" required bind:value={gEmail} placeholder="student@example.com" />
			</label>

			<label>
				Course
				<select required bind:value={gCourse}>
					<option value="" disabled>— pick a course —</option>
					{#each courses as c (c.slug)}
						<option value={c.slug}>{c.title ?? c.slug}</option>
					{/each}
				</select>
			</label>

			<label>
				Duration
				<select bind:value={gDuration} onchange={onDuration}>
					{#each DURATIONS as d (d.key)}
						<option value={d.key}>{d.label}</option>
					{/each}
				</select>
			</label>

			<label>
				Amount (Rs)
				<input type="number" min="0" step="1" bind:value={gAmount} placeholder="optional" />
			</label>
		</div>

		<p class="hint">If the student already has an active period for this course, the new one starts when it ends.</p>

		<div class="actions">
			{#if grantErr}<span class="error">{grantErr}</span>{/if}
			{#if grantMsg}<span class="ok">{grantMsg}</span>{/if}
			<button type="submit" disabled={granting}>{granting ? "Granting…" : "Grant"}</button>
		</div>
	</form>

	<!-- filters -->
	<form class="filters" onsubmit={searchSubmit}>
		<input type="email" bind:value={fEmail} placeholder="Exact student email" />
		<select bind:value={fCourse} onchange={load}>
			<option value="">All courses</option>
			{#each courses as c (c.slug)}
				<option value={c.slug}>{c.title ?? c.slug}</option>
			{/each}
		</select>
		<select bind:value={fActive} onchange={load}>
			<option value="">Any status</option>
			<option value="true">Active</option>
			<option value="false">Not active</option>
		</select>
		<button type="submit">Search</button>
		<button type="button" class="ghost" onclick={clearFilters}>Clear</button>
	</form>

	<!-- list -->
	{#if loading}
		<p>Loading…</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if rows.length === 0}
		<article class="card">No subscriptions found.</article>
	{:else}
		<p class="subtitle">{rows.length} subscription{rows.length === 1 ? "" : "s"}</p>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Student</th>
						<th>Course</th>
						<th>Starts</th>
						<th>Ends</th>
						<th>Amount</th>
						<th>Status</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each rows as s (s.id)}
						{@const st = statusOf(s)}
						<tr>
							<td>
								<button class="link" type="button" title="Use in grant form" onclick={() => (gEmail = s.user?.email ?? "")}>
									{s.user?.email ?? s.userId}
								</button>
								{#if s.user?.name}<div class="muted">{s.user.name}</div>{/if}
							</td>
							<td>{courseTitle(s.courseSlug)}</td>
							<td>{when(s.startsAt)}</td>
							<td>{s.endsAt ? when(s.endsAt) : "Lifetime"}</td>
							<td>{s.amount ?? "—"}</td>
							<td>
								<span class="badge {st}">{st}</span>
								{#if s.cancelledAt}<div class="muted">{when(s.cancelledAt)}</div>{/if}
							</td>
							<td class="right">
								{#if !s.cancelledAt}
									<button class="ghost" disabled={busyId === s.id} onclick={() => revoke(s)}>
										{busyId === s.id ? "…" : "Revoke"}
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</main>

<style>
	.page { width: min(95vw, 1100px); margin: 0 auto; padding: 2rem 1rem; box-sizing: border-box; color: var(--theme-text); }
	h1 { margin-top: 0; }
	h2 { margin: 0 0 1rem; font-size: 1.1rem; }
	.subtitle { opacity: .7; margin: 0 0 .5rem; }
	.muted { font-size: .75rem; opacity: .6; }
	.hint { font-size: .8rem; opacity: .65; margin: .75rem 0; }
	.error { color: #f87171; }
	.ok { color: #6ee7b7; }

	.card { margin-bottom: 1.5rem; padding: 1rem; border: 1px solid var(--theme-border); border-radius: 14px; background: var(--theme-panel); }

	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: .75rem; }
	label { display: grid; gap: .35rem; font-size: .85rem; font-weight: 600; }

	input, select {
		box-sizing: border-box; width: 100%; margin: 0; padding: .5rem .65rem;
		border: 1px solid var(--theme-border); border-radius: 8px;
		background: var(--theme-panel); color: var(--theme-text); font: inherit; font-weight: 400;
	}

	.actions { display: flex; justify-content: flex-end; align-items: center; gap: .75rem; flex-wrap: wrap; }

	.filters { display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: 1rem; }
	.filters input { flex: 2 1 220px; width: auto; }
	.filters select { flex: 1 1 150px; width: auto; }

	button { width: auto; margin: 0; padding: .5rem 1rem; border: 0; border-radius: 6px; background: var(--theme-accent); color: #fff; font: inherit; cursor: pointer; }
	button.ghost { background: transparent; border: 1px solid var(--theme-border); color: var(--theme-text); }
	button:disabled { opacity: .5; cursor: default; }
	button.link { all: unset; cursor: pointer; font-weight: 600; }
	button.link:hover { text-decoration: underline; }

	.table-wrap { overflow-x: auto; border: 1px solid var(--theme-border); border-radius: 14px; background: var(--theme-panel); }
	table { width: 100%; border-collapse: collapse; font-size: .9rem; }
	th, td { padding: .6rem .75rem; text-align: left; border-bottom: 1px solid var(--theme-border); vertical-align: top; }
	th { font-size: .75rem; text-transform: uppercase; letter-spacing: .04em; opacity: .7; }
	tbody tr:last-child td { border-bottom: 0; }
	td.right { text-align: right; }

	.badge { font-size: .7rem; font-weight: 700; padding: .15rem .55rem; border-radius: 999px; letter-spacing: .04em; text-transform: uppercase; }
	.badge.active { background: #064e3b; color: #6ee7b7; }
	.badge.upcoming { background: #1e3a5f; color: #93c5fd; }
	.badge.expired { background: #3a2c0a; color: #fcd34d; }
	.badge.cancelled { background: #334155; color: #cbd5e1; }
</style>