<script>
	// src/routes/admin/+layout.svelte
	import { page } from "$app/state";
	import { goto } from "$app/navigation";
	import { config } from "$lib/config.js";
	import { send } from "$lib/send";
	import Navbar from "$lib/adminComponents/Navbar.svelte";
	import AdminSidebar from "$lib/adminComponents/AdminSidebar.svelte";
	import TaleemTheme from "$lib/taleem-themes/TaleemTheme.svelte";
	import { blueTheme } from "$lib/taleem-themes/index.js";

	const SIGNIN_PATH = `${config.basePath}/admin/signin`;

	let isPlayer = $derived(
		page.url.pathname === `${config.basePath}/admin/player` ||
		page.url.pathname.startsWith(`${config.basePath}/player/`)
	);
	let isEditor = $derived(
		page.url.pathname === `${config.basePath}/admin/edit/editor` ||
		page.url.pathname.startsWith(`${config.basePath}/admin/edit/editor/`)
	);
	let isSignin = $derived(page.url.pathname === SIGNIN_PATH);
	let bare = $derived(isPlayer || isSignin || isEditor);

	let active = $derived.by(() => {
		const path = page.url.pathname;

		if (path.startsWith(`${config.basePath}/admin/assets`)) return "assets";
		if (path.startsWith(`${config.basePath}/admin/create/svg`)) return "add-svg";
		if (path.startsWith(`${config.basePath}/admin/edit/svgBulk`)) return "add-svg-bulk";
		if (path.startsWith(`${config.basePath}/admin/create/image`)) return "add-image";
		if (path.startsWith(`${config.basePath}/admin/create/audio`)) return "add-audio";
		if (path.startsWith(`${config.basePath}/admin/courses`)) return "courses";
		if (path.startsWith(`${config.basePath}/admin/svgs`)) return "svgs";
		if (path === `${config.basePath}/admin`) return "home";

		return "";
	});

	let { children } = $props();

	let checking = $state(true);
	let authed = $state(false);
	let admin = $state(null);
	let courses = $state([]);
	let coursesLoaded = false;
	let collapsed = $state(false);

	// admin.me returns isSuper (true / false) — decided by role SUPER_ADMIN on the server
	let isSuper = $derived(admin?.isSuper === true);

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
				admin = await send("admin", "me", {});
				authed = !!admin;
			} catch {
				admin = null;
				authed = false;
			}

			checking = false;

			if (!authed) {
				goto(SIGNIN_PATH);
				return;
			}

			if (!coursesLoaded) {
				coursesLoaded = true;
				try {
					courses = (await send("course", "list", {})) ?? [];
				} catch (err) {
					console.error(err);
				}
			}
		})();
	});
</script>

<TaleemTheme theme={blueTheme}>
	{#if bare}
		<main>
			{#if isSignin || (!checking && authed)}
				{@render children()}
			{/if}
		</main>
	{:else}
		<Navbar active={active} />

		<div class="shell" class:collapsed>
			{#if !checking && authed}
				<AdminSidebar {courses} {isSuper} bind:collapsed />
			{/if}

			<main>
				{#if !checking && authed}
					{@render children()}
				{/if}
			</main>
		</div>
	{/if}
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
		min-width: 0;
		min-height: 100vh;
		background: var(--theme-panel);
	}

	.shell {
		display: grid;
		grid-template-columns: 240px 1fr;
		align-items: start;
	}

	.shell.collapsed {
		grid-template-columns: 1fr;
	}

	@media (max-width: 800px) {
		.shell {
			grid-template-columns: 1fr;
		}
	}
</style>