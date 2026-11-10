<!-- src/lib/timings/ItemPreview.svelte -->
<!-- Read-only content of one timed item (or a whole slide when index is null). -->
<script>
	import katex from "katex";
	import "katex/dist/katex.min.css";

	let { slide, index } = $props();

	const IMG_BASE = "/content/images/";

	const item = $derived(index === null ? null : slide.data[index]);
	let broken = $state(false);

	function src(name) {
		return /^(\/|https?:)/.test(name) ? name : IMG_BASE + name;
	}

	function math(tex) {
		try {
			return katex.renderToString(tex ?? "", { throwOnError: false });
		} catch {
			return tex;
		}
	}
</script>

{#if index === null}
	{#if Array.isArray(slide.data) && slide.data.length && Array.isArray(slide.data[0])}
		<table class="mini">
			{#each slide.data as row, r}
				<tr>
					{#each row as cell}
						{#if r === 0}<th>{cell}</th>{:else}<td>{cell}</td>{/if}
					{/each}
				</tr>
			{/each}
		</table>
	{:else}
		<span class="muted">(whole slide)</span>
	{/if}
{:else if item.name === "image"}
	{#if broken || !item.content}
		<span class="muted">🖼 {item.content || "(no image)"}</span>
	{:else}
		<img src={src(item.content)} alt={item.content} onerror={() => (broken = true)} />
	{/if}
{:else if item.name === "card"}
	<span>{item.icon} {item.label}</span>
{:else if item.name === "bar"}
	<span>▮ {item.label}: {item.value}</span>
{:else if item.name === "line" && item.type === "math"}
	<span class="math">{@html math(item.content)}</span>
{:else if item.name === "line"}
	<span class:heading={item.type === "heading"}>{item.content}</span>
{:else}
	<span class="label">{item.name}</span>
	<span class:heading={item.name === "title" || item.name === "heading"}>{item.content}</span>
{/if}

<style>
	img {
		display: block;
		width: 100%;
		max-height: 60vh;
		object-fit: contain;
		object-position: left;
		border-radius: 6px;
		background: #fff1;
	}

	.heading {
		font-weight: 600;
	}

	.label {
		margin-right: 0.5rem;
		font-size: 0.7rem;
		text-transform: uppercase;
		color: #6b7280;
	}

	.muted {
		color: #6b7280;
	}

	.math {
		font-size: 1.05rem;
	}

	.mini {
		border-collapse: collapse;
		font-size: 0.8rem;
	}

	.mini th,
	.mini td {
		border: 1px solid #374151;
		padding: 2px 8px;
	}
</style>