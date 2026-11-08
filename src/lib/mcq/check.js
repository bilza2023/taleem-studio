// /src/lib/mcq/check.js

const norm = (s, caseSensitive) =>
	caseSensitive ? String(s).trim() : String(s).trim().toLowerCase();

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/** Grade one question. response is always string[]. → { correct, score 0..1 } */
export function check(q, r = []) {
	const f = q.flags ?? {};
	const correctIds = q.choices.filter((c) => c.correct).map((c) => c.id);

	switch (q.type) {
		case "single":
		case "boolean": {
			const ok = sameSet(r, correctIds);
			return { correct: ok, score: ok ? 1 : 0 };
		}
		case "multi": {
			const ok = sameSet(r, correctIds);
			if (ok || !f.partial) return { correct: ok, score: ok ? 1 : 0 };
			const hits = r.filter((id) => correctIds.includes(id)).length;
			const wrong = r.length - hits;
			return { correct: false, score: Math.max(0, (hits - wrong) / correctIds.length) };
		}
		case "number": {
			const n = Number(r[0]);
			const tol = f.tolerance ?? 0;
			const ok = r.length > 0 && Number.isFinite(n) &&
				q.choices.some((c) => Math.abs(Number(c.title) - n) <= tol);
			return { correct: ok, score: ok ? 1 : 0 };
		}
		case "text": {
			const ok = q.choices.some(
				(c) => norm(c.title, f.caseSensitive) === norm(r[0] ?? "", f.caseSensitive)
			);
			return { correct: ok, score: ok ? 1 : 0 };
		}
		case "selfCheck": {
			const ok = r[0] === "right";
			return { correct: ok, score: ok ? 1 : 0 };
		}
		case "match": {
			const expected = q.choices.filter((c) => c.pair).map((c) => `${c.id}=${c.pair}`);
			const hits = r.filter((p) => expected.includes(p)).length;
			return { correct: hits === expected.length, score: hits / expected.length };
		}
		case "order": {
			const expected = q.choices.map((c) => c.id);
			const ok = r.length === expected.length && r.every((id, i) => id === expected[i]);
			return { correct: ok, score: ok ? 1 : 0 };
		}
	}
	return { correct: false, score: 0 };
}

/** Has the student given a complete answer? */
export function isComplete(q, r = []) {
	switch (q.type) {
		case "match":
			return r.length === q.choices.filter((c) => c.pair).length;
		case "order":
			return r.length === q.choices.length;
		default:
			return r.length > 0 && String(r[0]).trim() !== "";
	}
}

/** Self-check is shown but never scored in test mode. */
export const isScored = (q, mode) => !(mode === "test" && q.type === "selfCheck");