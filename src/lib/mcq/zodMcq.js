// /src/lib/mcq/zodMcq.js
import { z } from "zod";
import { zodSlide } from "$lib/taleem-specs/schema/zodDeckV2";

/* ───────────── Enums ───────────── */

export const McqType = {
	SINGLE: "single",
	MULTI: "multi",
	BOOLEAN: "boolean",
	NUMBER: "number",
	TEXT: "text",
	SELF_CHECK: "selfCheck",
	MATCH: "match",
	ORDER: "order"
};

export const McqMode = {
	PRACTICE: "practice",
	TEST: "test"
};

/* ───────────── Slide ───────────── */
// MCQ slides are static: start/end default to 0 so authors can skip them.

const mcqSlide = z.preprocess(
	(s) => (s && typeof s === "object" ? { start: 0, end: 0, ...s } : s),
	zodSlide
);

/* ───────────── Choice ───────────── */

const choice = z.object({
	id: z.string().min(1),
	title: z.string(),
	correct: z.boolean().optional(),
	pair: z.string().optional(),          // match: id of the right-side choice
	flags: z.object({
		fixed: z.boolean().optional()     // keep position when shuffling
	}).optional()
});

/* ───────────── Question ───────────── */

const question = z.object({
	id: z.string().min(1),
	type: z.enum(Object.values(McqType)),
	points: z.number().positive().default(1),
	flags: z.object({
		partial: z.boolean().optional(),        // multi
		tolerance: z.number().min(0).optional(), // number
		caseSensitive: z.boolean().optional(),   // text
		display: z.string().optional()           // widget variant
	}).default({}),
	choices: z.array(choice).default([]),
	slides: z.object({
		question: mcqSlide,
		hint: mcqSlide.optional(),
		answer: mcqSlide.optional()
	})
}).superRefine((q, ctx) => {
	const err = (message) => ctx.addIssue({ code: "custom", message: `${q.id}: ${message}` });
	const ids = q.choices.map((c) => c.id);
	const correct = q.choices.filter((c) => c.correct);

	if (new Set(ids).size !== ids.length) err("choice ids must be unique");

	switch (q.type) {
		case McqType.SINGLE:
			if (q.choices.length < 2) err("single needs at least 2 choices");
			if (correct.length !== 1) err("single needs exactly 1 correct choice");
			break;

		case McqType.MULTI:
			if (q.choices.length < 2) err("multi needs at least 2 choices");
			if (correct.length < 1) err("multi needs at least 1 correct choice");
			break;

		case McqType.BOOLEAN:
			if (q.choices.length !== 2) err("boolean needs exactly 2 choices");
			if (correct.length !== 1) err("boolean needs exactly 1 correct choice");
			break;

		case McqType.NUMBER:
			if (q.choices.length < 1) err("number needs at least 1 accepted value");
			if (q.choices.some((c) => !Number.isFinite(Number(c.title))))
				err("number choices must have numeric titles");
			break;

		case McqType.TEXT:
			if (q.choices.length < 1) err("text needs at least 1 accepted answer");
			break;

		case McqType.SELF_CHECK:
			if (q.choices.length) err("selfCheck takes no choices");
			if (!q.slides.answer) err("selfCheck needs an answer slide");
			break;

		case McqType.MATCH: {
			const left = q.choices.filter((c) => c.pair);
			const rightIds = new Set(q.choices.filter((c) => !c.pair).map((c) => c.id));
			if (left.length < 2) err("match needs at least 2 pairs");
			for (const c of left)
				if (!rightIds.has(c.pair)) err(`choice ${c.id} pairs with unknown id ${c.pair}`);
			break;
		}

		case McqType.ORDER:
			if (q.choices.length < 2) err("order needs at least 2 items");
			break;
	}
});

/* ───────────── MCQ ───────────── */

export const zodMcq = z.object({
	name: z.string().optional(),
	settings: z.object({
		mode: z.enum(Object.values(McqMode)).default(McqMode.PRACTICE),
		timeLimit: z.number().positive().nullable().default(null), // seconds
		shuffleQuestions: z.boolean().default(false),
		shuffleChoices: z.boolean().default(false)
	}).default({}),
	questions: z.array(question).min(1)
}).superRefine((m, ctx) => {
	const ids = m.questions.map((q) => q.id);
	if (new Set(ids).size !== ids.length)
		ctx.addIssue({ code: "custom", message: "question ids must be unique" });
});