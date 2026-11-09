# How the MCQ module works

*8 November 2026 · written right after building it (≈ 8 hours, one session)*

> Status: **phase 1 complete** — runs on `/admin/mcq` from a golden JSON file.
> Not yet: loading from the database, student route `/mcq`, saving results.

---

## The problem

We needed an MCQ / quiz engine. Almost every MCQ engine on the market is
**text-based**: a question string, four option strings, a "correct" flag.

We already own something better: **TaleemSlide** — a renderer that draws
math, bullets, tables, images and SVGs beautifully. The hard part of any
quiz engine is never the logic (that's simple business rules); it's the UI.

So the question was: build an MCQ UI from scratch, or reuse our slides?

## The decision: questions ARE slides

We reuse the slide renderer. Every question carries up to **three slides**:

| Slide      | When shown                          |
|------------|-------------------------------------|
| `question` | always                              |
| `hint`     | optional — student asks for it      |
| `answer`   | optional — the explanation          |

Consequences:
- A question can look like anything a lesson slide can look like.
- Hints and explanations are full slides, not one grey sentence.
- All our existing SVGs and assets are usable in questions immediately.

## Going one level down: TaleemSlide, not TaleemUI

First attempt used `TaleemUI`, which **picks a slide by time**
(`currentTime >= start && currentTime < end`). An MCQ has no timeline —
the engine decides which slide to show (question / hint / answer).

So the MCQ uses the layer **below** TaleemUI:

```
Scene ► Background ► TaleemSlide
```

wrapped in `src/lib/mcq/SlideFrame.svelte`. It measures its own box and
passes `width`/`height` down — which also solved the "slide takes the
whole screen" problem. Every item gets `showAt: 0`, so everything shows
at once.

## Content on the slide, labels in the panel

The question slide **draws the options** (`A. √2`, `B. π` …), exactly like a
printed paper. The control panel under the slide only shows **labels**
(A B C D buttons).

This means the data never has to describe how an option *looks* — only
which label is correct.

Side effect (decided on purpose): **no `shuffleChoices`**. Shuffling labels
would break the match with what the slide shows. `shuffleQuestions` is fine.

## Few types, one format

Like slides (we expected hundreds, stopped at ~16), question types are
few. Rule: **a type exists only if the answer is collected differently.**
"Pick the right graph" or "assertion–reason" are just `single` with a
different slide.

The 8 types:

| type        | student does                 | response example      |
|-------------|------------------------------|-----------------------|
| `single`    | picks one                    | `["C"]`               |
| `multi`     | picks several                | `["A","C"]`           |
| `boolean`   | True / False                 | `["T"]`               |
| `number`    | types a number               | `["6"]`               |
| `text`      | types a word                 | `["hypotenuse"]`      |
| `selfCheck` | reveals answer, marks self   | `["right"]`           |
| `match`     | pairs left ↔ right           | `["1=b","2=c"]`       |
| `order`     | taps in sequence             | `["S","Q","P","R"]`   |

**Every response is an array of strings.** That one rule keeps the checker,
the report and future saving uniform.

### The data format

An MCQ is a Library item (`type: MCQ`); its JSON lives in `Library.body`,
exactly like a deck. **No schema change was needed.**

```json
{
  "name": "…",
  "theme": "blue",
  "background": { "backgroundImage": "banner.webp", "backgroundImageOpacity": 0.39 },
  "settings": { "mode": "practice", "timeLimit": null, "shuffleQuestions": false },
  "questions": [
    {
      "id": "q1",
      "type": "single",
      "points": 1,
      "flags": {},
      "choices": [
        { "id": "A", "title": "√2" },
        { "id": "C", "title": "0.75", "correct": true }
      ],
      "slides": { "question": {…}, "hint": {…}, "answer": {…} }
    }
  ]
}
```

How each type uses `choices`:
- `single` / `multi` / `boolean` — `correct: true` on the right choice(s)
- `number` / `text` — choices are the **accepted answers** (all correct)
- `match` — left items carry `pair: "<right id>"`; items without `pair` are the right column
- `order` — **authored in the correct order**; the panel shows them sorted by label
- `selfCheck` — no choices

Question `flags`: `partial` (multi), `tolerance` (number), `caseSensitive` (text).

Authoring rules:
- Slide slides don't need `start`/`end`; the engine handles it.
- Asset names are **bare** (`banner.webp`) — resolved at load time.
- For `order`, the slide must show items in a **scrambled** order, labels following that order.

## One checker for everything

`src/lib/mcq/check.js` — plain JS, no Svelte, so it can run on the server later.

```js
check(question, response) → { correct, score }   // score 0..1
isComplete(question, response)                   // answered fully?
isScored(question, mode)                         // selfCheck is unscored in test
```

Scoring notes:
- `multi` with `partial`: **wrong picks cancel right picks**
  (`(hits − wrong) / correct`), so selecting everything doesn't pay.
- `number`: any accepted value within `tolerance`.
- `text`: trimmed, case-insensitive unless `caseSensitive`.
- `match`: score = pairs right / total pairs.

## Two modes, one engine

The modes differ only in **when feedback is shown**:

| | Practice | Test |
|-|----------|------|
| Feedback | after each **Check** | only at the end |
| Hint / answer | anytime | after finishing |
| Try again | yes | no |
| Timer | — | `settings.timeLimit`, auto-submits |
| End | **Finish practice** | **Submit test** |

Both end in the same **report card**. After it, **Review answers** unlocks
everything for browsing.

On finish, any question that was answered but not checked is graded;
only empty questions count as **skipped**.

We kept practice mode deliberately: hints and animated explanations are
our strongest feature, and they only teach *during* practice.

## No exam security — on purpose

The answers are in the JSON and the browser grades. We are not a board
exam; a student who digs the answer out of devtools only cheats themselves.
If a real graded exam is ever needed: strip answers server-side and run the
same `check.js` on the server. That is a contained addition, not a rewrite.

## What the engine records

While the student works, the engine keeps:

```
responses  { qid: string[] }
results    { qid: { correct, score } }
log        { qid: { tries[], hintUsed, firstSeenAt, answeredAt } }
```

`src/lib/mcq/report.js` turns these into one **report object** (score,
counts, one row per question). The report card draws it, and `Mcq.svelte`
hands it out through `onFinish(report)`.

## Saving (decided, not built)

No new table. A finished MCQ becomes an `AnalyticsEvent`:

```
name: "mcq.finish", userId, role, slug, courseSlug, meta: <report JSON>
```

The existing indexes already serve "my history" (`userId, role, createdAt`)
and "this MCQ's results" (`slug`).

Rules when building it:
- save through an **awaited** `mcq.save`, never fire-and-forget `track()`
- analytics cleanup must **never** touch `mcq.*` events
- the analytics summary must not count `mcq.*` as lesson activity

If heavy per-question stats are ever needed, copying `mcq.finish` events
into a dedicated table is a one-off script.

## File map

```
src/lib/mcq/
  Mcq.svelte              the engine — <Mcq {mcq} onFinish={…} />
  SlideFrame.svelte       draws one slide (Scene ► Background ► TaleemSlide)
  AnswerPanel.svelte      the 8 answer widgets; knows nothing about scoring
  QuestionNav.svelte      Prev / dots / Next
  ReportCard.svelte       end-of-run report
  check.js                grading (pure JS)
  report.js               builds the report object (pure JS)
  resolveMcqAssets.js     bare asset names → /content/images/…
  zodMcq.js               validation schema (not wired in yet)
  golden-mcq.json         tour of all 8 types — the test fixture

src/routes/admin/mcq/+page.svelte    loads golden JSON, renders <Mcq>
```

Also touched: `src/lib/taleem-specs/schema/zodDeckV2.js` now exports
`zodSlide`, so MCQ validation reuses the exact deck slide rules.

## Gotchas we hit

- **`start: 0, end: 0` renders nothing** in TaleemUI — `0 < 0` is false.
  (Irrelevant now that we use TaleemSlide directly, but worth knowing.)
- **Missing `showAt` hides items** — SlideFrame defaults it to `0`.
- **Bare asset names 404** unless resolved; `resolveMcqAssets` sends all
  slides + background through `resolveAssetPaths` as one deck-shaped object.
- **Component styles don't reach children** — each component styles its own
  buttons. Colours are CSS variables (`--mcq-*`) set once on `.mcq` and
  inherited.
- **The admin layout's global `input` style wins** over a plain `input`
  selector — use `input.field`.

## Next steps

1. Style the top bar.
2. Load MCQs from the DB (`/admin/mcq?slug=…`) and turn zod validation back on.
3. Student route `/mcq?slug=…`.
4. Save results (`mcq.save` → `AnalyticsEvent`).
5. Math rendering (`useMath`) in `SlideFrame` once a question needs LaTeX.