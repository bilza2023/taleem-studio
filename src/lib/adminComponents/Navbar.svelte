<script>
	// src/lib/adminComponents/Navbar.svelte
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { config } from "$lib/config.js";

	// layout still passes `active`; not used any more (links live in the sidebar)
	let { active = "" } = $props();

	const base = config.basePath || "";

	let email = $state("");

	function refresh() {
		email = localStorage.getItem("taleem-admin-email") || "";
	}

	function logout() {
		localStorage.removeItem("taleem-admin-token");
		localStorage.removeItem("taleem-admin-email");
		email = "";
		window.dispatchEvent(new Event("authChanged"));
		goto(`${base}/admin/signin`);
	}

	onMount(() => {
		refresh();
		window.addEventListener("authChanged", refresh);
		return () => window.removeEventListener("authChanged", refresh);
	});
</script>

<nav class="navbar">
	<a class="brand" href={`${base}/admin`}>
				<img class="logo" src={`${base}/logo-mark-teal.png`} alt="" />
		<span class="name">Taleem<span class="dot">.</span>Admin</span>
	</a>

	<div class="right">
		<a class="site" href={`${base}/`} target="_blank" rel="noopener">View site ↗</a>

		{#if email}
			<span class="user" title={email}>👤 {email}</span>
			<button class="logout" title="Log out" onclick={logout}>Log out</button>
		{:else}
			<a class="logout" href={`${base}/admin/signin`}>Sign in</a>
		{/if}
	</div>
</nav>

<style>
	.navbar {
		--gold: #f5b932;
		--line: rgba(255, 255, 255, 0.14);
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 0;
		padding: 0.55rem 1rem;
		background: color-mix(in srgb, var(--theme-panel) 75%, black);
		border-bottom: 1px solid var(--line);
		color: var(--theme-text);
	}

	/* ── brand ── */
	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.3rem 0.7rem 0.3rem 0.35rem;
		border: 1px solid var(--line);
		border-radius: 10px;
		text-decoration: none;
		color: var(--theme-text);
		transition: border-color 0.15s ease;
	}

	.brand:hover {
		border-color: var(--gold);
	}

	.logo {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		object-fit: contain;
	}

	.name {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--gold);
	}

	.dot {
		color: var(--theme-text);
	}

	/* ── right side ── */
	.right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.site,
	.user,
	.logout {
		display: inline-flex;
		align-items: center;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--line);
		border-radius: 8px;
		font-size: 0.85rem;
		color: var(--theme-text);
		text-decoration: none;
		background: transparent;
	}

	.site:hover {
		border-color: var(--gold);
		color: var(--gold);
	}

	.user {
		max-width: 260px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		opacity: 0.85;
	}

	.logout {
		cursor: pointer;
		font: inherit;
		font-size: 0.85rem;
	}

	.logout:hover {
		border-color: #e5534b;
		color: #e5534b;
	}

	@media (max-width: 640px) {
		.user {
			display: none;
		}
	}
</style>