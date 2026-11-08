<!-- /src/lib/mcq/ReportCard.svelte -->
<script>
	let { report, onReview, onRestart } = $props();

	const STATUS = {
		correct: "✓ Correct",
		partial: "◐ Partial",
		wrong: "✗ Wrong",
		unanswered: "— Skipped",
		notScored: "Not scored"
	};

	const fmtTime = (s) => (s == null ? "—" : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`);
	const fmtPts = (n) => (Number.isInteger(n) ? n : n.toFixed(1));
</script>

<section class="rc">
	<header class="rc-head">
		<div class="big">{report.score.percent}%</div>
		<div>
			<div class="title">Report card · {report.mode === "test" ? "Test" : "Practice"}</div>
			<div class="sub">{fmtPts(report.score.earned)} / {report.score.total} points</div>
		</div>
	</header>

	<div class="counts">
		<span class="pill correct">✓ {report.counts.correct} correct</span>
		{#if report.counts.partial}<span class="pill partial">◐ {report.counts.partial} partial</span>{/if}
		<span class="pill wrong">✗ {report.counts.wrong} wrong</span>
		<span class="pill unanswered">— {report.counts.unanswered} skipped</span>
		{#if report.counts.notScored}<span class="pill notScored">{report.counts.notScored} not scored</span>{/if}
	</div>

	<div class="table-wrap">
		<table class="rc-table">
			<thead>
				<tr>
					<th>#</th>
					<th>Type</th>
					<th>Your answer</th>
					<th>Correct answer</th>
					<th>Result</th>
					<th>Points</th>
					<th>Hint</th>
					<th>Time</th>
				</tr>
			</thead>
			<tbody>
				{#each report.rows as row (row.id)}
					<tr>
						<td>{row.n}</td>
						<td class="muted">{row.type}</td>
						<td>{row.yourAnswer}</td>
						<td>{row.correctAnswer}</td>
						<td><span class="status {row.status}">{STATUS[row.status]}</span></td>
						<td>{row.status === "notScored" ? "—" : `${fmtPts(row.earned)} / ${row.points}`}</td>
						<td>{row.hintUsed ? "💡" : ""}</td>
						<td class="muted">{fmtTime(row.timeSec)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="actions">
		<button class="primary" onclick={onReview}>Review answers</button>
		<button onclick={onRestart}>Restart</button>
	</div>
</section>

<style>
	.rc {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
		background: var(--mcq-card);
		border: 1px solid var(--mcq-border);
		border-radius: var(--mcq-radius);
		color: var(--mcq-text);
	}
	.rc-head {
		display: flex;
		align-items: center;
		gap: 1.25rem;
	}
	.big {
		font-size: 2.6rem;
		font-weight: 800;
		color: var(--mcq-accent);
		line-height: 1;
	}
	.title {
		font-size: 1.15rem;
		font-weight: 700;
	}
	.sub {
		color: var(--mcq-muted);
	}

	.counts {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.pill {
		padding: 0.25rem 0.75rem;
		border-radius: 999px;
		font-size: 0.85rem;
		font-weight: 600;
		border: 1px solid var(--mcq-border);
		background: var(--mcq-bg);
	}
	.pill.correct { color: var(--mcq-ok); border-color: var(--mcq-ok); }
	.pill.partial { color: #f59e0b; border-color: #f59e0b; }
	.pill.wrong { color: var(--mcq-bad); border-color: var(--mcq-bad); }
	.pill.unanswered,
	.pill.notScored { color: var(--mcq-muted); }

	.table-wrap {
		overflow-x: auto;
	}
	table.rc-table {
		width: 100%;
		margin: 0;
		border-collapse: collapse;
		font-size: 0.9rem;
		background: transparent;
	}
	table.rc-table th,
	table.rc-table td {
		padding: 0.55rem 0.6rem;
		text-align: left;
		border-bottom: 1px solid var(--mcq-border);
		background: transparent;
		color: var(--mcq-text);
		white-space: nowrap;
	}
	table.rc-table th {
		color: var(--mcq-muted);
		font-weight: 600;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	table.rc-table td.muted {
		color: var(--mcq-muted);
	}

	.status {
		font-weight: 600;
	}
	.status.correct { color: var(--mcq-ok); }
	.status.partial { color: #f59e0b; }
	.status.wrong { color: var(--mcq-bad); }
	.status.unanswered,
	.status.notScored { color: var(--mcq-muted); }

	.actions {
		display: flex;
		gap: 0.75rem;
	}
	button {
		width: auto;
		margin: 0;
		font: inherit;
		padding: 0.55rem 1.3rem;
		border-radius: 8px;
		border: 1px solid var(--mcq-border);
		background: var(--mcq-card-hi);
		color: var(--mcq-text);
		cursor: pointer;
	}
	button:hover {
		border-color: var(--mcq-accent);
	}
	button.primary {
		background: var(--mcq-accent);
		border-color: var(--mcq-accent);
		color: #fff;
		font-weight: 600;
	}
</style>