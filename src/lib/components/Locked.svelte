<!-- /src/lib/components/Locked.svelte -->
<script>
	let { title = "This lesson is part of a paid course" } = $props();
</script>

<section class="locked">
	<div class="icon">🔒</div>
	<h2>{title}</h2>
	<p>Get full access to every lesson in this course.</p>
	<div class="actions">
		<a class="primary" href="/admission">Admissions</a>
		<a class="ghost" href="/samples">Try free samples</a>
	</div>
</section>

<style>
	.locked { width: min(92%, 560px); margin: 15vh auto; padding: 2rem; text-align: center; box-sizing: border-box;
		background: var(--theme-panel, #111827); color: var(--theme-text, #e5e7eb);
		border: 1px solid var(--theme-border, #334155); border-radius: 16px; }
	.icon { font-size: 2.5rem; }
	h2 { margin: .5rem 0; font-size: 1.4rem; }
	p { opacity: .75; margin: 0 0 1.5rem; }
	.actions { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; }
	a { padding: .65rem 1.4rem; border-radius: 8px; font-weight: 600; text-decoration: none; }
	.primary { background: #fbbf24; color: #111; }
	.ghost { border: 1px solid var(--theme-border, #334155); color: inherit; }
</style>