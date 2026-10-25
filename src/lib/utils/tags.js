// Tags are stored in the DB as a JSON string ("[]").
// Always work with arrays in the app; convert only at load/save.

export function parseTags(raw) {
	if (Array.isArray(raw)) return raw;

	try {
		const value = JSON.parse(raw ?? "[]");
		return Array.isArray(value) ? value : [];
	} catch {
		return [];
	}
}