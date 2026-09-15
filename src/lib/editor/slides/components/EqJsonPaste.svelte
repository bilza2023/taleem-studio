<script>
	import { eqLineArraySchema } from "$lib/taleem-specs/schema/zodDeckV2.js";

	export let slide;

	let open = false;
	let text = "";
	let error = "";

	function toggle() {
		if (!open) {
			text = JSON.stringify(slide.data, null, 2);
			error = "";
		}
		open = !open;
	}

	function save() {
		let parsed;

		try {
			parsed = JSON.parse(text);
		} catch (e) {
			error = "Invalid JSON: " + e.message;
			return;
		}

		const result = eqLineArraySchema.safeParse(parsed);

		if (!result.success) {
			error = result.error.issues
				.map(i => `${i.path.join(".")}: ${i.message}`)
				.join(" | ");
			return;
		}

		slide.data = result.data;
		text = "";
		error = "";
		open = false;
	}
</script>

<div class="eqJsonPaste">

	<button type="button" title="Paste JSON" on:click={toggle}>
		{"{ }"} JSON
	</button>

	{#if open}

		<div class="panel">

			<textarea
				bind:value={text}
				spellcheck="false"
				placeholder="Paste eq lines JSON here"
			></textarea>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<div class="actions">
				<button type="button" on:click={save}>
					Save / Update
				</button>
			</div>

		</div>

	{/if}

</div>

<style>
.eqJsonPaste {
	margin-bottom: 16px;
}

.panel {
	margin-top: 8px;
}

textarea {
	width: 100%;
	min-height: 220px;
	box-sizing: border-box;
	padding: 8px 10px;
	resize: vertical;
	background: var(--theme-panel);
	border: 1px solid var(--theme-border);
	border-radius: 5px;
	color: var(--theme-text);
	font: inherit;
	font-family: monospace;
}

textarea:focus {
	outline: none;
	border-color: var(--theme-accent);
}

.error {
	margin-top: 6px;
	padding: 6px 10px;
	border-radius: 5px;
	background: color-mix(in srgb, #b91c1c 20%, var(--theme-panel));
	border: 1px solid #b91c1c;
	color: var(--theme-text);
	font-size: 12px;
}

.actions {
	margin-top: 8px;
}

button {
	background: color-mix(in srgb, var(--theme-panel) 85%, white);
	border: 1px solid var(--theme-border);
	border-radius: 5px;
	color: var(--theme-text);
	cursor: pointer;
	padding: 4px 10px;
}

button:hover {
	background: color-mix(in srgb, var(--theme-border) 75%, var(--theme-accent));
}
</style>