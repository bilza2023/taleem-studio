<!-- /src/lib/mcq/AnswerPanel.svelte -->
<script>
	let {
		question,
		response = [],
		mode,                 // "practice" | "test"
		view,                 // "question" | "hint" | "answer"
		locked = false,       // inputs disabled
		showResult = false,   // colour right/wrong
		result = null,
		onChange,             // (newResponse: string[]) => void
		onSelfMark,           // (right: boolean) => void
		onSubmit              // () => void   (Enter key, practice)
	} = $props();

	const q = $derived(question);
	const reviewing = $derived(mode === "test" && locked);

	const leftItems = $derived(q.choices.filter((c) => c.pair));
	const rightItems = $derived(q.choices.filter((c) => !c.pair));
	const orderItems = $derived([...q.choices].sort((a, b) => a.id.localeCompare(b.id)));

	function pick(id) {
		if (locked) return;
		if (q.type === "multi") {
			onChange(response.includes(id) ? response.filter((x) => x !== id) : [...response, id]);
		} else {
			onChange([id]);
		}
	}

	function setMatch(leftId, rightId) {
		if (locked) return;
		const rest = response.filter((p) => !p.startsWith(`${leftId}=`));
		onChange(rightId ? [...rest, `${leftId}=${rightId}`] : rest);
	}

	const matchValue = (leftId) =>
		response.find((p) => p.startsWith(`${leftId}=`))?.split("=")[1] ?? "";

	function tapOrder(id) {
		if (locked || response.includes(id)) return;
		onChange([...response, id]);
	}
</script>

{#if q.type === "single" || q.type === "boolean" || q.type === "multi"}
	<div class="row">
		{#each q.choices as c (c.id)}
			<button
				class="choice"
				class:selected={response.includes(c.id)}
				class:right={showResult && c.correct}
				class:wrong={showResult && response.includes(c.id) && !c.correct}
				onclick={() => pick(c.id)}
			>
				{q.type === "boolean" ? c.title : c.id}
			</button>
		{/each}
	</div>
{:else if q.type === "number" || q.type === "text"}
	<input
		class="field"
		type={q.type === "number" ? "number" : "text"}
		placeholder={q.type === "number" ? "Enter a number" : "Type your answer"}
		value={response[0] ?? ""}
		disabled={locked}
		oninput={(e) => onChange([e.currentTarget.value])}
		onkeydown={(e) => e.key === "Enter" && mode === "practice" && onSubmit?.()}
	/>
{:else if q.type === "match"}
	{#each leftItems as l (l.id)}
		<div class="match-row">
			<span>{l.id}. {l.title}</span>
			<select class="field" value={matchValue(l.id)} disabled={locked} onchange={(e) => setMatch(l.id, e.currentTarget.value)}>
				<option value="">—</option>
				{#each rightItems as r (r.id)}
					<option value={r.id}>{r.id}. {r.title}</option>
				{/each}
			</select>
		</div>
	{/each}
{:else if q.type === "order"}
	<p class="muted">Tap in the correct order:</p>
	<div class="row">
		{#each orderItems as c (c.id)}
			<button class="choice" disabled={response.includes(c.id) || locked} onclick={() => tapOrder(c.id)}>
				{c.id}
			</button>
		{/each}
	</div>
	<p>Your order: <strong>{response.join(" → ") || "—"}</strong></p>
	{#if response.length && !locked}
		<button onclick={() => onChange([])}>Reset</button>
	{/if}
{:else if q.type === "selfCheck"}
	{#if mode === "test"}
		<p class="muted">
			{reviewing
				? "Not scored — compare your answer with the Answer slide."
				: "Write your answer on paper. Not scored; the model answer appears after you submit."}
		</p>
	{:else if !result}
		<p class="muted">Write your answer, then open the Answer slide and mark yourself.</p>
		{#if view === "answer"}
			<div class="row">
				<button onclick={() => onSelfMark(true)}>I got it right</button>
				<button onclick={() => onSelfMark(false)}>I got it wrong</button>
			</div>
		{/if}
	{/if}
{/if}

<style>
	.row {
		display: flex;
		gap: 0.6rem;
		flex-wrap: wrap;
		align-items: center;
	}

	button {
		width: auto;
		margin: 0;
		font: inherit;
		padding: 0.5rem 1.1rem;
		border-radius: 8px;
		border: 1px solid var(--mcq-border);
		background: var(--mcq-card-hi);
		color: var(--mcq-text);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s, transform 0.05s;
	}
	button:hover:not(:disabled) {
		border-color: var(--mcq-accent);
	}
	button:active:not(:disabled) {
		transform: translateY(1px);
	}
	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Big answer keys: A B C D / True False / order items */
	.choice {
		min-width: 3.5rem;
		height: 3.5rem;
		padding: 0 1.1rem;
		font-size: 1.2rem;
		font-weight: 700;
		border: 2px solid var(--mcq-border);
		border-radius: 10px;
		background: var(--mcq-bg);
	}
	.choice.selected {
		border-color: var(--mcq-accent);
		background: var(--mcq-accent-soft);
		color: #fff;
		box-shadow: 0 0 0 3px var(--mcq-accent-soft);
	}
	.choice.right {
		border-color: var(--mcq-ok);
		background: var(--mcq-ok-soft);
		color: var(--mcq-ok);
	}
	.choice.wrong {
		border-color: var(--mcq-bad);
		background: var(--mcq-bad-soft);
		color: var(--mcq-bad);
	}

	/* Text / number input + match selects
	   (input.field is more specific than the admin layout's global input style) */
	input.field,
	select.field {
		margin: 0;
		font: inherit;
		font-size: 1.05rem;
		padding: 0.6rem 0.9rem;
		height: auto;
		border-radius: 8px;
		border: 2px solid var(--mcq-border);
		background: var(--mcq-bg);
		color: var(--mcq-text);
		outline: none;
		box-shadow: none;
	}
	input.field {
		width: 100%;
		max-width: 360px;
	}
	input.field::placeholder {
		color: var(--mcq-muted);
	}
	input.field:focus,
	select.field:focus {
		border-color: var(--mcq-accent);
		box-shadow: 0 0 0 3px var(--mcq-accent-soft);
	}
	input.field:disabled,
	select.field:disabled {
		opacity: 0.6;
	}

	.match-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		align-items: center;
		padding: 0.4rem 0;
		border-bottom: 1px dashed var(--mcq-border);
	}
	.match-row:last-child {
		border-bottom: none;
	}
	.match-row span {
		font-weight: 600;
	}

	p {
		margin: 0;
	}
	.muted {
		color: var(--mcq-muted);
	}
</style>