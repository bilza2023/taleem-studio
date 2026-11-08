
<!-- /src/routes/admin/mcq/+page.svelte -->
<script>
	import SlideFrame from "$lib/mcq/SlideFrame.svelte";
	import AnswerPanel from "$lib/mcq/AnswerPanel.svelte";
	import QuestionNav from "$lib/mcq/QuestionNav.svelte";
	import ReportCard from "$lib/mcq/ReportCard.svelte";
	import { check, isComplete, isScored } from "$lib/mcq/check";
	import { buildReport } from "$lib/mcq/report";
	import { resolveMcqAssets } from "$lib/mcq/resolveMcqAssets";
	import mcq from "$lib/mcq/golden-mcq.json";

	const { background, questions } = resolveMcqAssets(mcq);
	const timeLimit = mcq.settings?.timeLimit ?? null; // seconds, test mode only

	/* ───────────── State ───────────── */

	let mode = $state(mcq.settings?.mode ?? "practice"); // "practice" | "test"
	let phase = $state("taking");                         // "taking" | "done"
	let showReport = $state(false);                       // done: report card vs review
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

	// After finishing (both modes) everything is unlocked for review
	const reviewing = $derived(phase === "done");
	const showResult = $derived(reviewing || (mode === "practice" && !!result));
	const locked = $derived(reviewing || (mode === "practice" && !!result));

	const canSeeHint = $derived(!!q.slides.hint && (mode === "practice" || reviewing));
	const canSeeAnswer = $derived(
		!!q.slides.answer &&
			(reviewing || (mode === "practice" && (!!result || q.type === "selfCheck")))
	);

	const slide = $derived(
		view === "hint" && canSeeHint
			? q.slides.hint
			: view === "answer" && canSeeAnswer
				? q.slides.answer
				: q.slides.question
	);

	const scoredQs = $derived(questions.filter((x) => isScored(x, mode)));
	const totalPoints = $derived(scoredQs.reduce((s, x) => s + (x.points ?? 1), 0));
	const earned = $derived(
		scoredQs.reduce((s, x) => s + (results[x.id]?.score ?? 0) * (x.points ?? 1), 0)
	);

	// Test: not answered yet · Practice: not checked yet
	// Questions with no answer at all (both modes)
	const pending = $derived(
		questions.filter(
			(x) => isScored(x, mode) && !results[x.id] && !isComplete(x, responses[x.id])
		).length
	);

	const statuses = $derived(
		questions.map((x) => {
			const res = results[x.id];
			const visible = reviewing || (mode === "practice" && !!res);
			if (visible) return res ? (res.correct ? "ok" : "bad") : "";
			return isComplete(x, responses[x.id]) ? "answered" : "";
		})
	);

	const report = $derived(
		phase === "done" ? buildReport({ questions, responses, results, log, mode }) : null
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
		showReport = false;
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
		if (reviewing) return;
		responses[q.id] = r;
		if (mode === "test") entry(q.id).answeredAt = Date.now();
	}

	// Practice only
	function submit() {
		if (locked || !isComplete(q, response)) return;
		results[q.id] = check(q, response);
		record(q.id, response, results[q.id]);
	}

	function selfMark(right) {
		if (reviewing) return;
		setResponse([right ? "right" : "wrong"]);
		results[q.id] = check(q, responses[q.id]);
		record(q.id, responses[q.id], results[q.id]);
	}

	function retry() {
		delete responses[q.id];
		delete results[q.id]; // log.tries keeps the history
		view = "question";
	}

	// Both modes: end → report card
	// Both modes: end → grade anything answered but not yet graded → report card
	function finish(auto = false) {
		if (phase !== "taking") return;

		if (!auto && pending) {
			if (!confirm(`${pending} question(s) unanswered. Finish anyway?`)) return;
		}

		for (const x of questions) {
			if (!isScored(x, mode) || results[x.id]) continue; // skip unscored + already checked
			const r = responses[x.id] ?? [];
			if (mode === "practice" && !isComplete(x, r)) continue; // practice: empty stays "skipped"
			results[x.id] = check(x, r);
			record(x.id, r, results[x.id]);
		}

		phase = "done";
		showReport = true;
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
				finish(true);
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
		{#if !showReport}
			<span>Q {index + 1} / {questions.length}</span>
			<span class="badge">{q.type}</span>
		{/if}
		{#if timeLeft !== null}
			<span class="timer" class:low={timeLeft <= 30}>⏱ {mmss(timeLeft)}</span>
		{/if}
		{#if reviewing && !showReport}
			<button onclick={() => (showReport = true)}>📋 Report card</button>
		{/if}
		{#if mode === "practice" || reviewing}
			<span class="score">Score: {earned.toFixed(1)} / {totalPoints}</span>
		{/if}
	</header>

	{#if showReport && report}
		<ReportCard {report} onReview={() => (showReport = false)} onRestart={() => reset(mode)} />
	{:else}
		<!-- The engine picks the slide; SlideFrame just draws it -->
		<SlideFrame {slide} {background} theme={mcq.theme} />

		<!-- Answer area -->
		<section class="panel">
			<div class="tabs">
				<button class:active={view === "question"} onclick={() => setView("question")}>Question</button>
				{#if canSeeHint}
					<button class:active={view === "hint"} onclick={() => setView("hint")}>Hint</button>
				{/if}
				{#if canSeeAnswer}
					<button class:active={view === "answer"} onclick={() => setView("answer")}>Answer</button>
				{/if}
			</div>

			<!-- mode passed as "test" while reviewing: the panel then shows read-only review text -->
			<AnswerPanel
				question={q}
				{response}
				mode={reviewing ? "test" : mode}
				{view}
				{locked}
				{showResult}
				{result}
				onChange={setResponse}
				onSelfMark={selfMark}
				onSubmit={submit}
			/>

			{#if mode === "practice" && !reviewing && q.type !== "selfCheck" && !result}
				<button class="submit" disabled={!isComplete(q, response)} onclick={submit}>Check</button>
			{/if}

			{#if showResult && result}
				<div class="result" class:ok={result.correct}>
					{result.correct
						? "✓ Correct"
						: result.score > 0
							? `Partly correct (${Math.round(result.score * 100)}%)`
							: "✗ Wrong"}
					{#if mode === "practice" && !reviewing}
						<button onclick={retry}>Try again</button>
					{/if}
				</div>
			{/if}
		</section>

		<!-- Navigation -->
		<QuestionNav count={questions.length} {index} {statuses} onGo={go} />

		{#if phase === "taking"}
			<button class="finish" onclick={() => finish()}>
				{mode === "test"
					? `Submit test${pending ? ` (${pending} unanswered)` : ""}`
					: "Finish practice"}
			</button>
		{/if}
	{/if}

	<!-- Dev: what we are collecting -->
	<details>
		<summary>Collected data (dev)</summary>
		<pre>{JSON.stringify({ mode, phase, responses, results, log, report }, null, 2)}</pre>
	</details>
</main>

<style>
	.mcq {
		/* Palette — inherited by AnswerPanel, QuestionNav, ReportCard */
		--mcq-bg: #0a1230;
		--mcq-card: #111c44;
		--mcq-card-hi: #172457;
		--mcq-border: #2c4590;
		--mcq-accent: #4f8cff;
		--mcq-accent-soft: rgba(79, 140, 255, 0.18);
		--mcq-text: #e8eeff;
		--mcq-muted: #8ea2d8;
		--mcq-ok: #22c55e;
		--mcq-ok-soft: rgba(34, 197, 94, 0.16);
		--mcq-bad: #ef4444;
		--mcq-bad-soft: rgba(239, 68, 68, 0.16);
		--mcq-radius: 12px;

		max-width: 900px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		color: var(--mcq-text);
	}

	/* ── Top bar (unchanged look, restyled later) ── */
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
	.badge {
		padding: 0.1rem 0.5rem;
		border-radius: 4px;
		background: var(--mcq-accent-soft);
		color: var(--mcq-accent);
		font-size: 0.8rem;
	}
	.row {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}
	.top button {
		width: auto;
		margin: 0;
	}
	.active {
		outline: 3px solid var(--mcq-accent);
	}

	/* ── Answer area card ── */
	.panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0.5rem 1rem 1rem;
		background: var(--mcq-card);
		border: 1px solid var(--mcq-border);
		border-radius: var(--mcq-radius);
	}
	.panel button {
		width: auto;
		margin: 0;
		padding: 0.5rem 1.1rem;
		border-radius: 8px;
		border: 1px solid var(--mcq-border);
		background: var(--mcq-card-hi);
		color: var(--mcq-text);
		cursor: pointer;
	}
	.panel button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* Question / Hint / Answer tabs */
	.tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--mcq-border);
	}
	.panel .tabs button {
		border: none;
		border-bottom: 2px solid transparent;
		border-radius: 0;
		background: transparent;
		color: var(--mcq-muted);
		padding: 0.6rem 1rem;
	}
	.panel .tabs button.active {
		color: var(--mcq-text);
		border-bottom-color: var(--mcq-accent);
		font-weight: 600;
		outline: none;
	}

	/* Check */
	.panel .submit {
		align-self: flex-start;
		padding: 0.6rem 2rem;
		background: var(--mcq-accent);
		border-color: var(--mcq-accent);
		color: #fff;
		font-weight: 600;
	}

	/* Result line */
	.result {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-weight: 600;
		color: var(--mcq-bad);
	}
	.result.ok {
		color: var(--mcq-ok);
	}

	/* Finish / Submit */
	.finish {
		align-self: center;
		width: auto;
		margin: 0;
		padding: 0.7rem 2.5rem;
		border-radius: 8px;
		border: 1px solid var(--mcq-accent);
		background: var(--mcq-accent);
		color: #fff;
		font-weight: 600;
		cursor: pointer;
	}

	pre {
		font-size: 0.75rem;
		max-height: 300px;
		overflow: auto;
	}
</style>