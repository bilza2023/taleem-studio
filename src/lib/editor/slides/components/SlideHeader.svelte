<!--/home/bilal-tariq/00--TALEEM/taleem.help/src/lib/editor/slides/components/SlideHeader.svelte-->

<script>

	export let slide;
	export let index;
	export let collapsed = false;

	export let isLast = false;

	export let onToggle = () => {};
	export let onMoveUp = () => {};
	export let onMoveDown = () => {};
	export let onDelete = () => {};

	export let onSetStart = () => {};
	export let onStartChange = () => {};
	export let onSetEnd = () => {};

</script>

<div class="slide-header">

	<div class="left">

		<button class="icon" on:click={onToggle}>
			{collapsed ? "▶" : "▼"}
		</button>

		<strong>
			#{index + 1}
		</strong>

		<span class="type">
			{slide.type}
		</span>

		<!-- START -->

		<label class="timing">

			<span>Start</span>

			<input
				type="number"
				step="1"
				min="0"
				bind:value={slide.start}
				on:change={() => onStartChange(slide.start)}
				disabled={index === 0}
			/>

		</label>

		<button
			class="icon"
			on:click={onSetStart}
			disabled={index === 0}
			title="Set Start From Audio"
		>
			⏱
		</button>

		<!-- END -->

		{#if isLast}

			<label class="timing">

				<span>End</span>

				<input
					type="number"
					step="0.1"
					min="0"
					bind:value={slide.end}
				/>

			</label>

			<button
				class="icon"
				on:click={onSetEnd}
				title="Set End From Audio"
			>
				⏱
			</button>

		{:else}

			<div class="end">

				End

				<strong>
					{slide.end ?? 0}
				</strong>

			</div>

		{/if}

	</div>

	<div class="right">

		<button class="icon" on:click={onMoveUp}>
			⬆
		</button>

		<button class="icon" on:click={onMoveDown}>
			⬇
		</button>

		<button class="icon" on:click={onDelete}>
			🗑
		</button>

	</div>

</div>
<style>

.slide-header{

	display:flex;
	align-items:center;
	justify-content:space-between;

	padding:8px 10px;

	background: color-mix(in srgb, var(--theme-panel) 80%, color-mix(in srgb, #f59e0b 45%, #22c55e));
	border-bottom:1px solid var(--theme-border);
	color: var(--theme-text);

}

.left{

	display:flex;
	align-items:center;
	gap:8px;

}

.right{

	display:flex;
	align-items:center;
	gap:4px;

}

.type{

	min-width:140px;
	color: var(--theme-accent);

}

.timing{

	display:flex;
	align-items:center;
	gap:4px;

	font-size:11px;
	color: var(--theme-text);

}

.timing input{

	width:64px;
	height:24px;

	padding:2px 4px;
	margin:0;

	font-size:12px;

	background: var(--theme-panel);
	border:1px solid var(--theme-border);
	border-radius:3px;
	color: var(--theme-text);

}

.end{

	display:flex;
	align-items:center;
	gap:4px;

	font-size:11px;
	color: var(--theme-text);
	opacity: 0.6;

	min-width:80px;

}

.icon{

	width:26px;
	height:26px;

	padding:0;

	display:flex;
	align-items:center;
	justify-content:center;

	font-size:12px;

	border:1px solid var(--theme-border);
	border-radius:4px;

	background: color-mix(in srgb, var(--theme-panel) 85%, white);
	color: var(--theme-text);

	cursor:pointer;

}

.icon:hover:not(:disabled){

	background: color-mix(in srgb, var(--theme-border) 75%, var(--theme-accent));

}

.icon:disabled{

	opacity:.35;
	cursor:default;

}

</style>