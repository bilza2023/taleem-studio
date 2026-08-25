<script>
    import { page } from "$app/state";
    import Navbar from "$lib/components/Navbar.svelte";
    import SubNav from "$lib/components/SubNav.svelte";
    import TaleemTheme from "$lib/taleem-themes/TaleemTheme.svelte";
    import { blueTheme } from "$lib/taleem-themes/index.js";
let isPlayer = $derived(page.url.pathname.startsWith("/player"));
    let active = "home";
    let { children } = $props();
</script>

<TaleemTheme theme={blueTheme}>

    {#if !isPlayer}
    	<Navbar />
        <SubNav active={active} />
    {/if}
    
    <main>
        {@render children()}
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