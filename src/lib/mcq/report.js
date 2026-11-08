// /src/lib/mcq/report.js
import { isScored } from "./check";

const titleOf = (q, id) => q.choices.find((c) => c.id === id)?.title ?? id;

/** Student's response → readable text */
export function formatAnswer(q, r = []) {
	if (!r.length) return "—";
	switch (q.type) {
		case "boolean":
			return r.map((id) => titleOf(q, id)).join(", ");
		case "single":
		case "multi":
			return [...r].sort().join(", ");
		case "number":
		case "text":
			return String(r[0]);
		case "match":
			return [...r].sort().map((p) => p.replace("=", " → ")).join(", ");
		case "order":
			return r.join(" → ");
		case "selfCheck":
			return r[0] === "right" ? "Marked right" : "Marked wrong";
	}
	return r.join(", ");
}

/** Correct answer → readable text */
export function formatCorrect(q) {
	switch (q.type) {
		case "single":
		case "multi":
			return q.choices.filter((c) => c.correct).map((c) => c.id).join(", ");
		case "boolean":
			return q.choices.filter((c) => c.correct).map((c) => c.title).join(", ");
		case "number":
		case "text":
			return q.choices.map((c) => c.title).join(" / ");
		case "match":
			return q.choices.filter((c) => c.pair).map((c) => `${c.id} → ${c.pair}`).join(", ");
		case "order":
			return q.choices.map((c) => c.id).join(" → ");
		case "selfCheck":
			return "See answer slide";
	}
	return "";
}

/**
 * One report shape for both modes.
 * status: "correct" | "partial" | "wrong" | "unanswered" | "notScored"
 */
export function buildReport({ questions, responses, results, log, mode }) {
	const rows = questions.map((q, i) => {
		const r = responses[q.id] ?? [];
		const res = results[q.id];
		const e = log[q.id] ?? {};
		const scored = isScored(q, mode);
		const points = q.points ?? 1;

		let status;
		if (!scored) status = "notScored";
		else if (!res || r.length === 0) status = "unanswered";
		else if (res.correct) status = "correct";
		else if (res.score > 0) status = "partial";
		else status = "wrong";

		const timeSec =
			e.firstSeenAt && e.answeredAt
				? Math.max(0, Math.round((e.answeredAt - e.firstSeenAt) / 1000))
				: null;

		return {
			n: i + 1,
			id: q.id,
			type: q.type,
			points,
			earned: scored && res ? res.score * points : 0,
			status,
			yourAnswer: formatAnswer(q, r),
			correctAnswer: formatCorrect(q),
			hintUsed: !!e.hintUsed,
			tries: e.tries?.length ?? 0,
			timeSec
		};
	});

	const scoredRows = rows.filter((x) => x.status !== "notScored");
	const total = scoredRows.reduce((s, x) => s + x.points, 0);
	const earned = scoredRows.reduce((s, x) => s + x.earned, 0);
	const count = (s) => rows.filter((x) => x.status === s).length;

	return {
		mode,
		finishedAt: Date.now(),
		score: { earned, total, percent: total ? Math.round((earned / total) * 100) : 0 },
		counts: {
			correct: count("correct"),
			partial: count("partial"),
			wrong: count("wrong"),
			unanswered: count("unanswered"),
			notScored: count("notScored")
		},
		rows
	};
}