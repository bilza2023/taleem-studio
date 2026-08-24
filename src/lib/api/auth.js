// src/lib/api/auth.js

export async function adminLogin(email, password) {
	let response;

	try {
		response = await fetch("/signin", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ email, password })
		});
	} catch {
		throw new Error("Unable to contact Taleem Studio.");
	}

	const contentType = response.headers.get("content-type") || "";

	const data = contentType.includes("application/json")
		? await response.json()
		: await response.text();

	if (!response.ok) {
		throw new Error(
			data?.error ||
			data?.message ||
			`HTTP ${response.status}`
		);
	}

	return data;
}