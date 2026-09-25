// /home/bilal-tariq/00--TALEEM/taleem/scripts/chapter-object/chapter.js
// The chapter object: pure logic, no printing, no file reading.
// Every function takes the kernel as its first argument and returns a report.
// With apply:false (default) nothing is written — the report is the preview.

const DECK_TYPE = 'PLAYER';

// 'ex7.1-q2-ii' → 'Ex7.1 Q2 Ii'   ·   'number-line.svg' → 'Number Line'
export function titleFromName(name) {
	return name
		.replace(/\.svg$/i, '')
		.split(/[-_]+/)
		.filter(Boolean)
		.map((w) => w[0].toUpperCase() + w.slice(1))
		.join(' ');
}

// ─── Plan ────────────────────────────────────────────────────────────────────
// Validates the plan and expands it into flat lists. Never touches the DB.
export function normalizePlan(plan) {
	const p = plan ?? {};
	const errors = [];

	if (!p.courseSlug) errors.push('courseSlug is required');
	if (!p.prefix || !p.prefix.endsWith('-')) errors.push('prefix is required and must end with "-"');
	if (!Array.isArray(p.groups) || !p.groups.length) errors.push('groups must be a non-empty array');
	if (p.svgs !== undefined && !Array.isArray(p.svgs)) errors.push('svgs must be an array');

	const groups = [];
	const decks = [];
	const svgs = [];
	const seenGroups = new Set();
	const seenDecks = new Set();
	const seenSvgs = new Set();

	for (const g of Array.isArray(p.groups) ? p.groups : []) {
		if (!g?.slug || !g?.title) {
			errors.push(`group ${g?.slug ?? '(missing)'}: slug and title are required`);
			continue;
		}
		if (seenGroups.has(g.slug)) {
			errors.push(`group ${g.slug}: duplicate in plan`);
			continue;
		}
		seenGroups.add(g.slug);
		groups.push({ slug: g.slug, title: g.title });

		if (!Array.isArray(g.decks)) {
			errors.push(`group ${g.slug}: decks must be an array`);
			continue;
		}

		g.decks.forEach((d, i) => {
			const name = typeof d === 'string' ? d : d?.name;
			if (!name) {
				errors.push(`group ${g.slug}: deck #${i} has no name`);
				return;
			}
			const slug = p.prefix + name;
			if (seenDecks.has(slug)) {
				errors.push(`deck ${slug}: duplicate in plan`);
				return;
			}
			seenDecks.add(slug);
			decks.push({
				slug,
				groupSlug: g.slug,
				sortOrder: i, // list position IS the order
				title: (typeof d === 'object' && d.title) || titleFromName(name)
			});
		});
	}

	for (const s of Array.isArray(p.svgs) ? p.svgs : []) {
		if (typeof s !== 'string' || !s.toLowerCase().endsWith('.svg')) {
			errors.push(`svg ${s}: must be a name ending in .svg`);
			continue;
		}
		if (seenSvgs.has(s)) {
			errors.push(`svg ${s}: duplicate in plan`);
			continue;
		}
		seenSvgs.add(s);
		svgs.push({ slug: s, title: titleFromName(s) });
	}

	return {
		errors,
		courseSlug: p.courseSlug,
		prefix: p.prefix,
		thumbnail: p.thumbnail ?? null,
		groups,
		decks,
		svgs
	};
}

// ─── create ──────────────────────────────────────────────────────────────────
// Builds the skeleton: groups → svgs (empty body) → decks (DRAFT, no body).
// Creates only what is missing. Never updates or moves an existing row.
export async function createChapter(k, rawPlan, { apply = false } = {}) {
	const plan = normalizePlan(rawPlan);
	const r = {
		kind: 'create',
		errors: [...plan.errors],
		notes: [],
		groups: { create: [], exists: [] },
		svgs: { create: [], exists: [] },
		decks: { create: [], exists: [], conflict: [] },
		failed: [],
		applied: false
	};
	if (r.errors.length) return r;

	const course = await k.course.get(plan.courseSlug);
	if (!course) {
		r.errors.push(`course "${plan.courseSlug}" not found`);
		return r;
	}

	for (const g of plan.groups) {
		const row = await k.group.get(plan.courseSlug, g.slug);
		if (!row) {
			r.groups.create.push(g);
			continue;
		}
		r.groups.exists.push(g);
		if (row.title !== g.title) {
			r.notes.push(`group ${g.slug}: DB title "${row.title}" ≠ plan "${g.title}" (left as is)`);
		}
	}

	for (const s of plan.svgs) {
		const row = await k.svg.get(s.slug);
		(row ? r.svgs.exists : r.svgs.create).push(s);
	}

	for (const d of plan.decks) {
		// includeUnpublished is essential: skeletons are DRAFT and would look missing otherwise
		const row = await k.library.get(d.slug, { includeUnpublished: true });
		if (!row) {
			r.decks.create.push(d);
		} else if (row.courseSlug === plan.courseSlug && row.groupSlug === d.groupSlug) {
			r.decks.exists.push(d);
			if (row.sortOrder !== d.sortOrder) {
				r.notes.push(`deck ${d.slug}: DB sortOrder ${row.sortOrder} ≠ plan ${d.sortOrder} (left as is)`);
			}
		} else {
			r.decks.conflict.push({ ...d, where: `${row.courseSlug} / ${row.groupSlug}` });
		}
	}

	if (r.decks.conflict.length) {
		r.errors.push(`${r.decks.conflict.length} deck slug(s) already live in another course/group — fix the plan`);
	}
	if (!apply || r.errors.length) return r;

	// ── writes: strict order, stop if a stage fails ──
	for (const g of r.groups.create) {
		try {
			await k.group.create({ courseSlug: plan.courseSlug, slug: g.slug, title: g.title });
		} catch (err) {
			r.failed.push({ slug: `group ${g.slug}`, reason: err.message });
		}
	}
	if (r.failed.length) return r; // decks would hit the FK anyway

	for (const s of r.svgs.create) {
		try {
			await k.svg.create({ slug: s.slug, title: s.title, body: '' });
		} catch (err) {
			r.failed.push({ slug: `svg ${s.slug}`, reason: err.message });
		}
	}

	for (const d of r.decks.create) {
		try {
			await k.library.create({
				slug: d.slug,
				title: d.title,
				type: DECK_TYPE,
				courseSlug: plan.courseSlug,
				groupSlug: d.groupSlug,
				sortOrder: d.sortOrder,
				thumbnail: plan.thumbnail,
				meta: ''
				// status → DRAFT (schema default), body → null
			});
		} catch (err) {
			r.failed.push({ slug: `deck ${d.slug}`, reason: err.message });
		}
	}

	r.applied = true;
	return r;
}

// ─── upload (shared) ─────────────────────────────────────────────────────────
// items: [{ slug, content }]
// fill mode (default): write only where the DB body is empty
// overwrite mode:      write wherever the body differs — body only, nothing else
async function uploadBodies({ plan, planned, items, validate, toBody, get, write, overwrite, apply, kind }) {
	const r = {
		kind,
		mode: overwrite ? 'overwrite' : 'fill',
		errors: [...plan.errors],
		write: [],
		skipFilled: [],
		unchanged: [],
		missing: [],
		notInPlan: [],
		notCreated: [],
		invalid: [],
		failed: [],
		applied: false
	};
	if (r.errors.length) return r;

	const seen = new Set();
	const todo = [];

	for (const it of items) {
		const slug = it?.slug;
		if (!slug) {
			r.invalid.push({ slug: '(missing)', reason: 'no slug' });
			continue;
		}
		if (seen.has(slug)) {
			r.invalid.push({ slug, reason: 'duplicate in upload' });
			continue;
		}
		seen.add(slug);

		if (!planned.has(slug)) {
			r.notInPlan.push(slug);
			continue;
		}
		const problem = validate(it.content);
		if (problem) {
			r.invalid.push({ slug, reason: problem });
			continue;
		}
		const row = await get(slug);
		if (!row) {
			r.notCreated.push(slug);
			continue;
		}

		const body = toBody(it.content);
		const empty = !row.body;
		if (row.body === body) r.unchanged.push(slug);
		else if (!empty && !overwrite) r.skipFilled.push(slug);
		else todo.push({ slug, body, replaces: !empty });
	}

	r.missing = [...planned].filter((s) => !seen.has(s)); // planned, no content yet — fine
	r.write = todo.map((t) => (t.replaces ? `${t.slug}   (overwrite)` : t.slug));

	if (r.invalid.length) r.errors.push(`${r.invalid.length} invalid item(s)`);
	if (r.notInPlan.length) r.errors.push(`${r.notInPlan.length} item(s) not in the plan`);
	if (r.notCreated.length) r.errors.push(`${r.notCreated.length} item(s) not created yet — run create first`);
	if (!apply || r.errors.length) return r;

	for (const t of todo) {
		try {
			await write(t.slug, t.body);
		} catch (err) {
			r.failed.push({ slug: t.slug, reason: err.message });
		}
	}
	r.applied = true;
	return r;
}

// ─── uploadSvg ───────────────────────────────────────────────────────────────
// items: [{ slug: 'number-line.svg', content: '<svg …>…</svg>' }]
export async function uploadSvgs(k, rawPlan, items, { overwrite = false, apply = false } = {}) {
	const plan = normalizePlan(rawPlan);
	return uploadBodies({
		kind: 'upload-svg',
		plan,
		planned: new Set(plan.svgs.map((s) => s.slug)),
		items,
		overwrite,
		apply,
		validate: (c) => {
			if (typeof c !== 'string') return 'content is not text';
			const t = c.trim();
			return t.includes('<svg') && t.endsWith('</svg>') ? null : 'not a complete <svg>…</svg>';
		},
		toBody: (c) => c.trim(),
		get: (slug) => k.svg.get(slug),
		write: (slug, body) => k.svg.update(slug, { body })
	});
}

// ─── upload (decks) ──────────────────────────────────────────────────────────
// items: [{ slug: 'fbise9math-ch7-ex7.1-q1', content: { version, deck: [...] } }]
export async function uploadDecks(k, rawPlan, items, { overwrite = false, apply = false } = {}) {
	const plan = normalizePlan(rawPlan);
	return uploadBodies({
		kind: 'upload',
		plan,
		planned: new Set(plan.decks.map((d) => d.slug)),
		items,
		overwrite,
		apply,
		validate: (c) =>
			c && typeof c === 'object' && Array.isArray(c.deck) ? null : 'body must be an object with a deck array',
		toBody: (c) => JSON.stringify(c),
		get: (slug) => k.library.get(slug, { includeUnpublished: true }),
		write: (slug, body) => k.library.update(slug, { body })
	});
}