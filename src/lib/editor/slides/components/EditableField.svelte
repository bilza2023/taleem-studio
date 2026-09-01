<!-- src/lib/editor/slides/components/EditableField.svelte -->

<script>

	export let label = "";

	export let object;
	export let property = "content";

	export let multiline = true;

	export let runningTime = 0;

	function setShowAt() {
		object.showAt = runningTime;
	}

	function updateText(e) {
		object[property] = e.target.value;
	}

	function updateShowAt(e) {
		object.showAt = Number(e.target.value);
	}

</script>

<div class="field-editor">

	<div class="toolbar">

		<strong>{label}</strong>

		<div class="showat">

			<span>Show</span>

			<input
				type="number"
				step="0.1"
				min="0"
				value={object.showAt ?? 0}
				on:input={updateShowAt}
			/>

			<button
				type="button"
				on:click={setShowAt}
				title="Use Current Time"
			>
				⏱
			</button>

		</div>

	</div>

	{#if multiline}

		<textarea
			rows="3"
			value={object[property]}
			on:input={updateText}
		/>

	{:else}

		<input
			type="text"
			value={object[property]}
			on:input={updateText}
		/>

	{/if}

</div>
<style>

.field-editor{

	margin-bottom:14px;

}

.toolbar{

	display:flex;
	align-items:center;
	justify-content:space-between;

	margin-bottom:6px;
	color: var(--theme-text);

}

.showat{

	display:flex;
	align-items:center;
	gap:4px;

	font-size:12px;
	color: var(--theme-text);
	opacity: 0.8;

}

.showat input{

	width:100px;
    text-align: center;
	min-width:76px;

	padding:2px 4px;

	text-align:right;

	background: var(--theme-panel);
	border:1px solid var(--theme-border);
	border-radius:3px;
	color: var(--theme-text);

}

textarea,
input[type="text"]{

	width:100%;
	font:inherit;

	padding:8px 10px;
	box-sizing:border-box;

	background: color-mix(in srgb, var(--theme-panel) 90%, black);
	border:1px solid var(--theme-border);
	border-radius:5px;
	color: var(--theme-text);

}

textarea:focus,
input[type="text"]:focus,
.showat input:focus{

	outline:none;
	border-color: var(--theme-accent);

}

textarea{

	min-height:70px;
	resize:vertical;

}

button{

	padding:2px 6px;
	cursor:pointer;

	background: color-mix(in srgb, var(--theme-panel) 85%, white);
	border:1px solid var(--theme-border);
	border-radius:3px;
	color: var(--theme-text);

}

button:hover{

	background: color-mix(in srgb, var(--theme-border) 75%, var(--theme-accent));

}

</style>