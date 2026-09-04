<script>
	import { onMount } from "svelte";
	import { config } from "$lib/config.js";

	let { active = "" } = $props();

	const basePath = config.basePath;

	let email = $state("");

	function refresh() {
		email = localStorage.getItem("taleem-admin-email") || "";
	}

	function logout() {
		localStorage.removeItem("taleem-admin-token");
		localStorage.removeItem("taleem-admin-email");
		email = "";
		window.dispatchEvent(new Event("authChanged"));
	}

	onMount(() => {
		refresh();

		window.addEventListener("authChanged", refresh);

		return () => {
			window.removeEventListener("authChanged", refresh);
		};
	});
</script>

<nav class="navbar">
	<a class="home" href={config.basePath || "/admin"}>
		<span class="icon">📘</span>
		<span style="color:orange">Taleem.Admin</span>
	</a>

	<div class="pills">
		<a class="pill {active === 'home' ? 'active' : ''}" href={`${basePath}/admin`} data-sveltekit-preload-data>
			Home
		</a>
		<a class="pill {active === 'assets' ? 'active' : ''}" href={`${basePath}/admin/assets`} data-sveltekit-preload-data>
			Assets
		</a>
		<a class="pill {active === 'add-svg' ? 'active' : ''}" href={`${basePath}/admin/create/svg`} data-sveltekit-preload-data>
			＋ SVG
		</a>
		<a class="pill {active === 'add-image' ? 'active' : ''}" href={`${basePath}/admin/create/image`} data-sveltekit-preload-data>
			＋ Image
		</a>
		<a class="pill {active === 'add-audio' ? 'active' : ''}" href={`${basePath}/admin/create/audio`} data-sveltekit-preload-data>
			＋ Audio
		</a>
	</div>

	<div class="right">

		{#if email}
			<span class="email">👤 {email}</span>

			<button
				class="auth-button"
				title="Logout"
				onclick={logout}
			>
				🚪
			</button>
		{:else}
			
				class="auth-button"
				title="Sign in"
				href={`${config.basePath}/admin/signin`}
			<a>
				🔑
			</a>
		{/if}

	</div>
</nav>

<style>
	.navbar {
		margin: 0;
		padding: .6rem 1rem;
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		gap: 1.25rem;
		background: var(--theme-panel);
		color: var(--theme-text);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--theme-border);
	}

	.home {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		flex-shrink: 0;
		text-decoration: none;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--theme-text);
		transition: color 0.2s ease;
	}

	.home:hover {
		color: var(--theme-accent);
	}

	.icon {
		font-size: 1.15rem;
		line-height: 1;
	}

	.pills {
		display: flex;
		align-items: center;
		gap: .55rem;
		overflow-x: auto;
		scrollbar-width: none;
		white-space: nowrap;
	}

	.pills::-webkit-scrollbar { display: none; }

	.pill {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: .4rem .8rem;
		border-radius: 10px;
		font-size: .85rem;
		font-weight: 500;
		border: 1px solid var(--theme-border);
		cursor: pointer;
		background: var(--theme-panel);
		color: var(--theme-text);
		text-decoration: none;
		transition: background-color .15s, transform .15s;
	}

	.pill:hover {
		background: var(--theme-accent);
		color: var(--theme-text);
		transform: translateY(-1px);
	}

	.pill:visited { color: var(--theme-text); }

	.pill.active {
		background: var(--theme-accent);
		color: var(--theme-text);
	}

	.pill.active::after {
		content: "";
		position: absolute;
		left: 8px;
		right: 8px;
		bottom: -6px;
		height: 3px;
		border-radius: 3px;
		background: var(--theme-accent);
	}

	.pill:focus,
	.pill:focus-visible {
		outline: none;
		box-shadow: none;
	}

	.right {
		margin-left: auto;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.email {
		font-size: 0.9rem;
		opacity: .9;
	}

	.auth-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px 6px;
		border: 0;
		background: transparent;
		color: inherit;
		font-size: 1.15rem;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
	}

	.auth-button:hover {
		opacity: .7;
	}
</style>