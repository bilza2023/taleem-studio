<!-- /src/routes/admin/mcq/+page.svelte -->
<script>
	// /src/routes/admin/mcq/+page.svelte
	import SlideFrame from "$lib/mcq/SlideFrame.svelte";
	import { check, isComplete, isScored } from "$lib/mcq/check";
	import { resolveAssetPaths } from "$lib/utils/player-utils/resolveAssetPaths.js";
	import mcq from "$lib/mcq/golden-mcq.json";

	/* ───────────── Asset paths ───────────── */
	// JSON stores bare file names; resolve them once here.
	// All slides + background go through ONE deck-shaped call,
	// so mapDeckAssets always sees a normal deck (background + deck array).

	const ASSET_BASE = "/content/images/";

	const slideRefs = mcq.questions.flatMap((q) =>
		Object.entries(q.slides).map(([key, slide]) => ({ qid: q.id, key, slide }))
	);

	const resolvedDeck = resolveAssetPaths(
		{ background: mcq.background, deck: slideRefs.map((r) => r.slide) },
		ASSET_BASE
	);

	const background = resolvedDeck.background;

	const questions = mcq.questions.map((q) => ({
		...q,
		slides: Object.fromEntries(
			slideRefs
				.map((r, i) => ({ ...r, resolved: resolvedDeck.deck[i] }))
				.filter((r) => r.qid === q.id)
				.map((r) => [r.key, r.resolved])
		)
	}));

	const timeLimit = mcq.settings?.timeLimit ?? null; // seconds, test mode only

	/* ───────────── State ───────────── */

	let mode = $state(mcq.settings?.mode ?? "practice"); // "practice" | "test"
	let phase = $state("taking");                         // test: "taking" | "review"
	let index = $state(0);
	let view = $state("question");                        // "question" | "hint" | "answer"
	let responses = $state({});                           // { qid: string[] }
	let results = $state({});                             // { qid: { correct, score } }
	let log = $state({});                                 // { qid: { tries, hintUsed, firstSeenAt, answeredAt } }
	let timeLeft = $state(null);
	let runId = $state(0);                                // bumps on every reset → restarts timer

	/* ───────────── Derived ───────────── */

	const q = $derived(questions[index]);
	const response = $derived(responses[q.id] ?? []);
	const result = $derived(results[q.id]);

	const reviewing = $derived(mode === "test" && phase === "review");
	const showResult = $derived(mode === "practice" ? !!result : reviewing);
	const locked = $derived(mode === "practice" ? !!result : reviewing);

	const canSeeHint = $derived(!!q.slides.hint && (mode === "practice" || reviewing));
	const canSeeAnswer = $derived(
		!!q.slides.answer &&
			(mode === "practice" ? !!result || q.type === "selfCheck" : reviewing)
	);

	const slide = $derived(
		view === "hint" && canSeeHint
			? q.slides.hint
			: view === "answer" && canSeeAnswer
				? q.slides.answer
				: q.slides.question
	);

	const leftItems = $derived(q.choices.filter((c) => c.pair));
	const rightItems = $derived(q.choices.filter((c) => !c.pair));
	const orderItems = $derived([...q.choices].sort((a, b) => a.id.localeCompare(b.id)));

	const scoredQs = $derived(questions.filter((x) => isScored(x, mode)));
	const totalPoints = $derived(scoredQs.reduce((s, x) => s + (x.points ?? 1), 0));
	const earned = $derived(
		scoredQs.reduce((s, x) => s + (results[x.id]?.score ?? 0) * (x.points ?? 1), 0)
	);
	const unanswered = $derived(
		questions.filter((x) => isScored(x, mode) && !isComplete(x, responses[x.id])).length
	);

	/* ───────────── Log ───────────── */

	function entry(qid) {
		if (!log[qid]) log[qid] = { tries: [], hintUsed: false, firstSeenAt: null, answeredAt: null };
		return log[qid];
	}

	function seen(qid) {
		const e = entry(qid);
		if (!e.firstSeenAt) e.firstSeenAt = Date.now();
	}

	function record(qid, r, res) {
		const e = entry(qid);
		e.tries.push({ r: $state.snapshot(r), ...res, at: Date.now() });
		e.answeredAt = Date.now();
	}

	/* ───────────── Actions ───────────── */

	function reset(newMode = mode) {
		mode = newMode;
		phase = "taking";
		index = 0;
		view = "question";
		responses = {};
		results = {};
		log = {};
		seen(questions[0].id);
		runId += 1;
	}
	reset();

	function setView(v) {
		view = v;
		if (v === "hint" && !reviewing) entry(q.id).hintUsed = true;
	}

	function setResponse(r) {
		responses[q.id] = r;
		if (mode === "test") entry(q.id).answeredAt = Date.now();
	}

	function pick(id) {
		if (locked) return;
		if (q.type === "multi") {
			setResponse(response.includes(id) ? response.filter((x) => x !== id) : [...response, id]);
		} else {
			setResponse([id]);
		}
	}

	function setMatch(leftId, rightId) {
		if (locked) return;
		const rest = response.filter((p) => !p.startsWith(`${leftId}=`));
		setResponse(rightId ? [...rest, `${leftId}=${rightId}`] : rest);
	}
	const matchValue = (leftId) =>
		response.find((p) => p.startsWith(`${leftId}=`))?.split("=")[1] ?? "";

	function tapOrder(id) {
		if (locked || response.includes(id)) return;
		setResponse([...response, id]);
	}

	// Practice only
	function submit() {
		if (locked || !isComplete(q, response)) return;
		results[q.id] = check(q, response);
		record(q.id, response, results[q.id]);
	}

	function selfMark(right) {
		setResponse([right ? "right" : "wrong"]);
		results[q.id] = check(q, responses[q.id]);
		record(q.id, responses[q.id], results[q.id]);
	}

	function retry() {
		delete responses[q.id];
		delete results[q.id]; // log.tries keeps the history
		view = "question";
	}

	// Test only
	function submitTest(auto = false) {
		if (phase !== "taking") return;
		if (!auto && unanswered && !confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return;

		for (const x of questions) {
			if (!isScored(x, "test")) continue;
			const r = responses[x.id] ?? [];
			results[x.id] = check(x, r);
			record(x.id, r, results[x.id]);
		}
		phase = "review";
		index = 0;
		view = "question";
	}

	function go(i) {
		if (i < 0 || i >= questions.length) return;
		index = i;
		view = "question";
		seen(questions[i].id);
	}

	/* ───────────── Timer (test mode) ───────────── */

	$effect(() => {
		runId; // restart timer on every reset
		if (mode !== "test" || phase !== "taking" || !timeLimit) {
			timeLeft = null;
			return;
		}
		timeLeft = timeLimit;
		const t = setInterval(() => {
			timeLeft -= 1;
			if (timeLeft <= 0) {
				clearInterval(t);
				submitTest(true);
			}
		}, 1000);
		return () => clearInterval(t);
	});

	const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
</script>

<main class="mcq">
	<!-- Top bar -->
	<header class="top">
		<div class="row">
			<button class:active={mode === "practice"} onclick={() => reset("practice")}>Practice</button>
			<button class:active={mode === "test"} onclick={() => reset("test")}>Test</button>
		</div>
		<span>Q {index + 1} / {questions.length}</span>
		<span class="badge">{q.type}</span>
		{#if timeLeft !== null}
			<span class="timer" class:low={timeLeft <= 30}>⏱ {mmss(timeLeft)}</span>
		{/if}
		{#if mode === "practice" || reviewing}
			<span class="score">Score: {earned.toFixed(1)} / {totalPoints}</span>
		{/if}
	</header>

	{#if reviewing}
		<div class="summary">
			Test submitted · <strong>{earned.toFixed(1)} / {totalPoints}</strong>
			({totalPoints ? Math.round((earned / totalPoints) * 100) : 0}%)
			<button class="outline" onclick={() => reset("test")}>Restart test</button>
		</div>
	{/if}

	<!-- The engine picks the slide; SlideFrame just draws it -->
	<SlideFrame {slide} background={mcq.background} theme={mcq.theme} />

	<!-- View switch -->
	<div class="row">
		<button class:active={view === "question"} onclick={() => setView("question")}>Question</button>
		{#if canSeeHint}
			<button class:active={view === "hint"} onclick={() => setView("hint")}>Hint</button>
		{/if}
		{#if canSeeAnswer}
			<button class:active={view === "answer"} onclick={() => setView("answer")}>Answer</button>
		{/if}
	</div>

	<!-- Control panel -->
	<section class="panel">
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
				type={q.type === "number" ? "number" : "text"}
				placeholder={q.type === "number" ? "Enter a number" : "Type your answer"}
				value={response[0] ?? ""}
				disabled={locked}
				oninput={(e) => setResponse([e.currentTarget.value])}
				onkeydown={(e) => e.key === "Enter" && mode === "practice" && submit()}
			/>
		{:else if q.type === "match"}
			{#each leftItems as l (l.id)}
				<div class="match-row">
					<span>{l.id}. {l.title}</span>
					<select value={matchValue(l.id)} disabled={locked} onchange={(e) => setMatch(l.id, e.currentTarget.value)}>
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
				<button class="outline" onclick={() => setResponse([])}>Reset</button>
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
						<button onclick={() => selfMark(true)}>I got it right</button>
						<button class="outline" onclick={() => selfMark(false)}>I got it wrong</button>
					</div>
				{/if}
			{/if}
		{/if}

		<!-- Practice: Check -->
		{#if mode === "practice" && q.type !== "selfCheck" && !result}
			<button class="submit" disabled={!isComplete(q, response)} onclick={submit}>Check</button>
		{/if}

		<!-- Result -->
		{#if showResult && result}
			<div class="result" class:ok={result.correct}>
				{result.correct
					? "✓ Correct"
					: result.score > 0
						? `Partly correct (${Math.round(result.score * 100)}%)`
						: "✗ Wrong"}
				{#if mode === "practice"}
					<button class="outline" onclick={retry}>Try again</button>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Navigation -->
	<footer class="row nav">
		<button class="outline" disabled={index === 0} onclick={() => go(index - 1)}>← Prev</button>
		<div class="dots">
			{#each questions as x, i (x.id)}
				{@const res = results[x.id]}
				{@const visible = mode === "practice" ? !!res : reviewing}
				<button
					class="dot"
					class:current={i === index}
					class:answered={!visible && isComplete(x, responses[x.id])}
					class:ok={visible && res?.correct}
					class:bad={visible && res && !res.correct}
					onclick={() => go(i)}
				>{i + 1}</button>
			{/each}
		</div>
		<button class="outline" disabled={index === questions.length - 1} onclick={() => go(index + 1)}>Next →</button>
	</footer>

	{#if mode === "test" && phase === "taking"}
		<button class="submit-test" onclick={() => submitTest()}>
			Submit test {unanswered ? `(${unanswered} unanswered)` : ""}
		</button>
	{/if}

	<!-- Dev: what we are collecting -->
	<details>
		<summary>Collected data (dev)</summary>
		<pre>{JSON.stringify({ mode, phase, responses, results, log }, null, 2)}</pre>
	</details>
</main>

<style>
	.mcq {
		max-width: 900px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.top {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.score {
		margin-left: auto;
	}
	.timer {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}
	.timer.low {
		color: crimson;
	}
	.summary {
		display: flex;
		gap: 1rem;
		align-items: center;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		background: var(--pico-card-background-color);
		border: 1px solid var(--pico-muted-border-color);
	}
	.badge {
		padding: 0.1rem 0.5rem;
		border-radius: 4px;
		background: var(--pico-primary-background);
		color: var(--pico-primary-inverse);
		font-size: 0.8rem;
	}
	.row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}
	.row button,
	.panel button,
	.summary button {
		width: auto;
		margin: 0;
	}
	.active {
		outline: 3px solid var(--pico-primary);
	}
	.panel {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.choice {
		min-width: 4rem;
		background: transparent;
		color: var(--pico-color);
		border: 2px solid var(--pico-muted-border-color);
	}
	.choice.selected {
		border-color: var(--pico-primary);
		background: var(--pico-primary-focus);
	}
	.choice.right {
		border-color: green;
		background: rgba(0, 128, 0, 0.15);
	}
	.choice.wrong {
		border-color: crimson;
		background: rgba(220, 20, 60, 0.15);
	}
	.match-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		align-items: center;
	}
	.match-row select {
		margin: 0;
	}
	.submit {
		align-self: flex-start;
	}
	.submit-test {
		align-self: center;
		width: auto;
	}
	.result {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-weight: 600;
		color: crimson;
	}
	.result.ok {
		color: green;
	}
	.muted {
		opacity: 0.7;
		margin: 0;
	}
	.nav {
		justify-content: space-between;
	}
	.dots {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.dot {
		width: 2.2rem;
		height: 2.2rem;
		padding: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--pico-color);
		border: 2px solid var(--pico-muted-border-color);
	}
	.dot.current {
		border-color: var(--pico-primary);
	}
	.dot.answered {
		background: var(--pico-primary-focus);
	}
	.dot.ok {
		background: rgba(0, 128, 0, 0.25);
	}
	.dot.bad {
		background: rgba(220, 20, 60, 0.25);
	}
	pre {
		font-size: 0.75rem;
		max-height: 300px;
		overflow: auto;
	}
</style>