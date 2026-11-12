<!-- src/lib/components/Navbar.svelte -->
<script>
	import { onMount } from "svelte";
	import { afterNavigate } from "$app/navigation";
	import { config } from "$lib/config.js";
	import { courses, rs } from "$lib/components/home/courses.js";

	const base = config.basePath || "";
	const browseHref = (c) => `${base}/course?course=${encodeURIComponent(c.slug)}`;
	const buyHref = (c) => `${base}/admissions?course=${encodeURIComponent(c.slug)}`;

	let email = $state("");
	let coursesOpen = $state(false);
	let mobileOpen = $state(false);
	let dropEl;

	// ---- auth (same logic as before) ----
	function refresh() {
		email = localStorage.getItem("taleem-email") || "";
	}

	function logout() {
		localStorage.removeItem("taleem-token");
		localStorage.removeItem("taleem-email");
		email = "";
		window.dispatchEvent(new Event("authChanged"));
	}

	// ---- menus ----
	function closeAll() {
		coursesOpen = false;
		mobileOpen = false;
	}

	function onDocClick(e) {
		if (coursesOpen && dropEl && !dropEl.contains(e.target)) coursesOpen = false;
	}

	function onKey(e) {
		if (e.key === "Escape") closeAll();
	}

	// re-read login after every page change (fixes "still shows Sign in after signing in")
	afterNavigate(() => {
		refresh();
		closeAll();
	});

	onMount(() => {
		refresh();
		window.addEventListener("authChanged", refresh);
		window.addEventListener("storage", refresh); // other tabs
		document.addEventListener("click", onDocClick);
		document.addEventListener("keydown", onKey);

		return () => {
			window.removeEventListener("authChanged", refresh);
			window.removeEventListener("storage", refresh);
			document.removeEventListener("click", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	});
</script>

<nav class="navbar">
	<div class="bar">
		<!-- Brand -->
		<a class="home" href={base || "/"}>
			<span class="mark">📘</span>
			<span class="brand">taleem<span class="dot-help">.help</span></span>
		</a>

		<!-- Centre links (desktop) -->
		<div class="links">
			<div
				class="drop"
				role="presentation"
				bind:this={dropEl}
				onmouseenter={() => (coursesOpen = true)}
				onmouseleave={() => (coursesOpen = false)}
			>
				<button
					class="link"
					class:active={coursesOpen}
					aria-expanded={coursesOpen}
					onclick={() => (coursesOpen = true)}
				>
					Courses
					<svg class="caret" viewBox="0 0 12 12" width="10" height="10"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>

				{#if coursesOpen}
					<div class="panel">
						<div class="panel-inner">
							<div class="panel-head">Choose your course</div>

							{#each courses as c (c.slug)}
								<div class="row">
									<img class="thumb" src={`${base}/content/images/${c.image}`} alt={c.title} loading="lazy" />
									<div class="info">
										<div class="t">
											{c.title}
											{#if c.tag}<span class="tag">{c.tag}</span>{/if}
										</div>
										<div class="s">{c.subject}</div>
										<div class="p">
											{rs(c.price.year)} <span>/ year</span>
											{#if c.price.half}<em>or {rs(c.price.half)} / 6 mo</em>{/if}
										</div>
									</div>
									<div class="acts">
										<a class="mini ghost" href={browseHref(c)}>Browse</a>
										<a class="mini gold" href={buyHref(c)}>Subscribe</a>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<a class="link" href={`${base}/#samples`}>Samples</a>
			<a class="link" href={`${base}/course?course=blog`}>
				Blog <span class="free">Free</span>
			</a>
		</div>

		<!-- Right side -->
		<div class="right">
			{#if email}
				<a class="icon-btn" title="Hub" href={`${base}/hub`}>
					<svg viewBox="0 0 24 24" width="19" height="19"><path d="M6 8a6 6 0 1112 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 003.4 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</a>
				<span class="email" title={email}>{email}</span>
				<button class="icon-btn" title="Logout" onclick={logout}>
					<svg viewBox="0 0 24 24" width="19" height="19"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
				</button>
			{:else}
				<a class="text-link" href={`${base}/signin`}>Sign in</a>
				<a class="text-link" href={`${base}/signup`}>Sign up</a>
			{/if}

			<a class="cta" href={`${base}/admissions`}>Admissions</a>

			<button class="burger" aria-label="Menu" aria-expanded={mobileOpen} onclick={() => (mobileOpen = !mobileOpen)}>
				<span></span><span></span><span></span>
			</button>
		</div>
	</div>

	<!-- Mobile panel -->
	{#if mobileOpen}
		<div class="mobile">
			<div class="m-head">Courses</div>
			{#each courses as c (c.slug)}
				<div class="m-row">
					<div>
						<div class="t">{c.title}</div>
						<div class="p">{rs(c.price.year)} <span>/ year</span></div>
					</div>
					<div class="acts">
						<a class="mini ghost" href={browseHref(c)}>Browse</a>
						<a class="mini gold" href={buyHref(c)}>Subscribe</a>
					</div>
				</div>
			{/each}

			<div class="m-links">
				<a href={`${base}/#samples`}>Samples</a>
				<a href={`${base}/course?course=blog`}>Blog <span class="free">Free</span></a>
				{#if email}
					<a href={`${base}/hub`}>Hub</a>
					<span class="m-email">{email}</span>
				{:else}
					<a href={`${base}/signin`}>Sign in</a>
					<a href={`${base}/signup`}>Sign up</a>
				{/if}
			</div>
		</div>
	{/if}
</nav>

<style>
	.navbar {
		--gold: #f5b932;
		--teal: #2ec4c4;
		--ink: #e8edf8;
		--muted: #9aa7c7;
		position: sticky;
		top: 0;
		z-index: 100;
		width: 100%;
		font-family: "Poppins", "Segoe UI", system-ui, -apple-system, sans-serif;
		background: rgba(11, 20, 46, 0.82);
		backdrop-filter: blur(14px) saturate(150%);
		-webkit-backdrop-filter: blur(14px) saturate(150%);
		border-bottom: 1px solid rgba(245, 185, 50, 0.16);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
	}

	/* full width — no max-width cap */
	.bar {
		width: 100%;
		height: 64px;
		padding: 0 1.5rem;
		box-sizing: border-box;
		display: flex;
		align-items: center;
		gap: 2rem;
	}

	/* ---------- brand ---------- */
	.home {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		text-decoration: none;
		flex-shrink: 0;
	}

	.mark {
		font-size: 1.4rem;
		line-height: 1;
		transition: transform 0.25s ease;
	}

	.home:hover .mark {
		transform: rotate(-6deg) scale(1.06);
	}

	.brand {
		font-size: 1.35rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: #fff;
	}

	.dot-help {
		color: var(--teal);
		font-weight: 600;
	}

	/* ---------- centre links ---------- */
	.links {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.link {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		margin: 0;
		padding: 0.5rem 0.85rem;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: var(--ink);
		font: inherit;
		font-size: 0.95rem;
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		transition: color 0.2s ease, background 0.2s ease;
	}

	.link:hover,
	.link.active {
		color: var(--gold);
		background: rgba(245, 185, 50, 0.07);
	}

	.caret {
		transition: transform 0.2s ease;
	}

	.link.active .caret {
		transform: rotate(180deg);
	}

	.free {
		padding: 0.08rem 0.4rem;
		border-radius: 5px;
		background: rgba(46, 196, 196, 0.15);
		color: var(--teal);
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	/* ---------- dropdown ---------- */
	.drop {
		position: relative;
	}

	.panel {
		position: absolute;
		top: 100%;
		left: -1rem;
		padding-top: 0.6rem; /* hover bridge */
	}

	.panel-inner {
		width: 470px;
		padding: 0.75rem;
		border-radius: 16px;
		background: linear-gradient(180deg, #17234a 0%, #0d1530 100%);
		border: 1px solid rgba(245, 185, 50, 0.4);
		box-shadow:
			0 18px 50px rgba(0, 0, 0, 0.55),
			0 0 28px rgba(245, 185, 50, 0.12);
		animation: drop-in 0.16s ease-out;
	}

	@keyframes drop-in {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.panel-head {
		padding: 0.25rem 0.5rem 0.6rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.row {
		display: grid;
		grid-template-columns: 104px 1fr auto;
		align-items: center;
		gap: 0.85rem;
		padding: 0.85rem 0.75rem;
		border-radius: 12px;
		transition: background 0.15s ease;
		
	}

	.row:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.thumb {
		width: 104px;
		aspect-ratio: 16 / 9;
		object-fit: cover;
		border-radius: 8px;
		background: #0a0f22;
	}

	.t {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.95rem;
		font-weight: 700;
		color: #fff;
	}

	.tag {
		padding: 0.08rem 0.4rem;
		border-radius: 5px;
		background: var(--gold);
		color: #1a1300;
		font-size: 0.58rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.s {
		margin-top: 0.1rem;
		font-size: 0.68rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #5fd4e6;
	}

	.p {
		margin-top: 0.2rem;
		font-size: 0.95rem;
		font-weight: 800;
		color: var(--gold);
	}

	.p span {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--ink);
	}

	.p em {
		display: block;
		font-style: normal;
		font-size: 0.7rem;
		font-weight: 400;
		color: var(--muted);
	}

	.acts {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.mini {
		display: inline-flex;
		justify-content: center;
		padding: 0.38rem 0.8rem;
		border-radius: 8px;
		font-size: 0.78rem;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
		transition: background 0.2s ease, box-shadow 0.2s ease;
	}

	.mini.ghost {
		border: 1px solid rgba(255, 255, 255, 0.25);
		color: #fff;
	}

	.mini.ghost:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	.mini.gold {
		background: var(--gold);
		color: #1a1300;
		box-shadow: 0 4px 12px rgba(245, 185, 50, 0.3);
	}

	.mini.gold:hover {
		box-shadow: 0 6px 18px rgba(245, 185, 50, 0.5);
	}

	/* ---------- right ---------- */
	.right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.text-link {
		padding: 0.45rem 0.6rem;
		color: var(--ink);
		font-size: 0.9rem;
		font-weight: 500;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.text-link:hover {
		color: var(--gold);
	}

	.email {
		max-width: 200px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		padding: 0.3rem 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.14);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.04);
		color: var(--ink);
		font-size: 0.82rem;
	}

	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		margin: 0;
		padding: 0;
		border: 0;
		border-radius: 10px;
		background: transparent;
		color: var(--ink);
		cursor: pointer;
		transition: background 0.2s ease, color 0.2s ease;
	}

	.icon-btn:hover {
		background: rgba(245, 185, 50, 0.1);
		color: var(--gold);
	}

	.cta {
		margin-left: 0.25rem;
		padding: 0.55rem 1.15rem;
		border-radius: 10px;
		background: var(--gold);
		color: #1a1300;
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
		box-shadow: 0 4px 16px rgba(245, 185, 50, 0.3);
		transition: box-shadow 0.2s ease, transform 0.15s ease;
	}

	.cta:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 22px rgba(245, 185, 50, 0.5);
	}

	/* ---------- focus ---------- */
	.home:focus-visible,
	.link:focus-visible,
	.icon-btn:focus-visible,
	.cta:focus-visible,
	.mini:focus-visible {
		outline: 2px solid var(--gold);
		outline-offset: 2px;
	}

	/* ---------- mobile ---------- */
	.burger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 4px;
		width: 38px;
		height: 38px;
		margin: 0;
		padding: 0 9px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 10px;
		background: transparent;
		cursor: pointer;
	}

	.burger span {
		display: block;
		height: 2px;
		border-radius: 2px;
		background: var(--ink);
	}

	.mobile {
		padding: 0.75rem 1.5rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		background: #0d1530;
		animation: drop-in 0.16s ease-out;
	}

	.m-head {
		margin-bottom: 0.4rem;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.m-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.6rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.m-row .acts {
		flex-direction: row;
	}

	.m-links {
		display: flex;
		flex-direction: column;
		margin-top: 0.5rem;
	}

	.m-links a {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.7rem 0;
		color: var(--ink);
		font-weight: 500;
		text-decoration: none;
	}

	.m-email {
		padding: 0.7rem 0;
		color: var(--muted);
		font-size: 0.85rem;
	}

	@media (max-width: 900px) {
		.links,
		.email,
		.text-link {
			display: none;
		}

		.burger {
			display: inline-flex;
		}

		.bar {
			gap: 1rem;
			padding: 0 1rem;
		}
	}

	@media (max-width: 420px) {
		.cta {
			padding: 0.5rem 0.8rem;
			font-size: 0.82rem;
		}

		.brand {
			font-size: 1.15rem;
		}
	}
</style>