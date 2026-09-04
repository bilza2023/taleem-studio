<script>
///home/bilal-tariq/00--TALEEM/taleem.studio/src/routes/admin/+layout.svelte
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { config } from "$lib/config.js";
	import { send } from "$lib/send";
	import Navbar from "$lib/adminComponents/Navbar.svelte";
	import SubNav from "$lib/adminComponents/SubNav.svelte";
	import TaleemTheme from "$lib/taleem-themes/TaleemTheme.svelte";
	import { blueTheme } from "$lib/taleem-themes/index.js";

	const SIGNIN_PATH = `${config.basePath}/admin/signin`;

	let isPlayer = $derived(
		page.url.pathname === `${config.basePath}/admin/player` ||
		page.url.pathname.startsWith(`${config.basePath}/player/`)
	);
	let isEditor = $derived(
		page.url.pathname === `${config.basePath}/edit/editor` ||
		page.url.pathname.startsWith(`${config.basePath}/edit/editor/`)
	);
	let isSignin = $derived(page.url.pathname === SIGNIN_PATH);

	let active = "home";
	let { children } = $props();

	let checking = $state(true);
	let authed = $state(false);

	$effect(() => {
		const path = page.url.pathname;

		if (path === SIGNIN_PATH) {
			checking = false;
			authed = false;
			return;
		}

		checking = true;

		(async () => {
			try {
				const admin = await send("admin", "authenticate", {});
				authed = !!admin;
			} catch {
				authed = false;
			}

			checking = false;

			if (!authed) goto(SIGNIN_PATH);
		})();
	});
</script>

<TaleemTheme theme={blueTheme}>
	{#if !isPlayer && !isSignin && !isEditor}
		<Navbar />
		<SubNav active={active} />
	{/if}

	<main>
		{#if isSignin || (!checking && authed)}
			{@render children()}
		{/if}
	</main>
</TaleemTheme>

<style>
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		width: 100%;
		min-height: 100%;
		background: var(--theme-panel);
	}

	main {
		margin: 0;
		padding: 0;
		min-height: 100vh;
		background: var(--theme-panel);
	}
</style>