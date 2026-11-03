// src/lib/taleem-kernel/modules/Analytics.js

export default class Analytics {
	constructor(kernel) { this.kernel = kernel; }

	// ── Core writer ──────────────────────────────────────────
	// The only method that touches db.analyticsEvent for writing.
	// Never throws. Callers don't await it; tests can.
	track(name, { userId = null, role = null, slug = null, courseSlug = null, meta = null } = {}) {
		if (!name) return Promise.resolve(null);

		return this.kernel.db.analyticsEvent
			.create({
				data: {
					name,
					userId,
					role,
					slug,
					courseSlug,
					meta: meta ? JSON.stringify(meta) : null
				}
			})
			.catch((err) => {
				console.error(`Analytics.track(): '${name}' failed —`, err.message);
				return null;
			});
	}

	// ── Reader ───────────────────────────────────────────────
	async list(filters = {}) {
		const where = {};
		if (filters.name) where.name = filters.name;
		if (filters.userId !== undefined) where.userId = filters.userId;
		if (filters.role) where.role = filters.role;
		if (filters.slug) where.slug = filters.slug;
		if (filters.courseSlug) where.courseSlug = filters.courseSlug;
		if (filters.since) where.createdAt = { gte: filters.since };

		return this.kernel.db.analyticsEvent.findMany({
			where,
			orderBy: { createdAt: "desc" }
		});
	}
}