<script>

import { onMount } from "svelte";
import { config } from "$lib/config.js";
	let email = $state("");

	function refresh() {
		email = localStorage.getItem("taleem-email") || "";
	}

	function logout() {
		localStorage.removeItem("taleem-token");
		localStorage.removeItem("taleem-email");
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
<a class="home" href={config.basePath || "/"}>
	<span class="icon">📘</span>
	<span class="brand">Taleem.Help</span>
	<span class="beta">(Beta)</span>
</a>

	<div class="right">

		{#if email}
		<a class="auth-button" title="Hub" href={`${config.basePath}/hub`}>📢</a>
			<span class="email">👤 {email}</span>

			<button class="auth-button" title="Logout" onclick={logout}>🚪</button>
		{:else}
			<a class="auth-button" title="Sign in" href={`${config.basePath}/signin`}>🔑</a>
			<a class="auth-button" title="Sign in" href={`${config.basePath}/signup`}>🔒</a>
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
		background: color-mix(in srgb, var(--theme-panel) 85%, transparent);
		color: var(--theme-text);
		backdrop-filter: blur(10px) saturate(140%);
		-webkit-backdrop-filter: blur(10px) saturate(140%);
		border-bottom: 1px solid transparent;
		border-image: linear-gradient(
			90deg,
			transparent,
			color-mix(in srgb, #bbe793 60%, transparent) 25%,
			color-mix(in srgb, #E8791A 50%, transparent) 75%,
			transparent
		) 1;
		box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
	}

	/* ---------- Brand ---------- */

	.home {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		text-decoration: none;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--theme-text);
		transition: transform 0.2s ease, filter 0.2s ease;
	}

	.home:hover {
		transform: translateY(-1px);
		filter: brightness(1.12);
	}

	.icon {
		font-size: 1.15rem;
		line-height: 1;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
		transition: transform 0.25s ease;
	}

	.home:hover .icon {
		transform: rotate(-8deg) scale(1.08);
	}

	.brand {
		color: #bbe793; /* fallback */
		font-weight: 700;
		letter-spacing: 0.02em;
		background: linear-gradient(90deg, #bbe793, #8fd16a);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.beta {
		color: #E8791A;
		font-weight: 600;
		font-size: 0.8em;
		margin-left: 4px;
		padding: 1px 7px;
		line-height: 1;
		border: 1px solid color-mix(in srgb, #E8791A 55%, transparent);
		border-radius: 999px;
		background: color-mix(in srgb, #E8791A 12%, transparent);
	}

	/* ---------- Right side ---------- */

	.right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.email {
		font-size: 0.9rem;
		opacity: .95;
		padding: 2px 10px;
		line-height: 1.4;
		border: 1px solid var(--theme-border);
		border-radius: 999px;
		background: color-mix(in srgb, var(--theme-text) 6%, transparent);
	}

	.auth-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px 6px;
		border: 0;
		border-radius: 8px;
		background: transparent;
		color: inherit;
		font-size: 1.15rem;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.2s ease, transform 0.15s ease;
	}

	.auth-button:hover {
		background: color-mix(in srgb, var(--theme-accent) 18%, transparent);
		transform: translateY(-1px);
	}

	.auth-button:active {
		transform: translateY(0) scale(0.95);
	}

	/* ---------- Keyboard focus ---------- */

	.home:focus-visible,
	.auth-button:focus-visible {
		outline: 2px solid var(--theme-accent);
		outline-offset: 2px;
		border-radius: 8px;
	}
</style>