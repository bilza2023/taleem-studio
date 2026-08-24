// src/lib/api/admin.js

import { config } from "$lib/config";

async function request(method, path, body = null) {
	const options = {
		method,
		headers: {}
	};

	const token = localStorage.getItem("taleem-admin-token");

	if (token) {
		options.headers.Authorization = `Bearer ${token}`;
	}

	if (body !== null) {
		options.headers["Content-Type"] = "application/json";
		options.body = JSON.stringify(body);
	}

	let response;

	try {
		response = await fetch(`${config.apiUrl}${path}`, options);
	} catch {
		throw new Error("Unable to contact Taleem Server.");
	}

	const contentType = response.headers.get("content-type") || "";

	let data;

	if (contentType.includes("application/json")) {
		data = await response.json();
	} else {
		data = await response.text();
	}

	if (!response.ok) {
		throw new Error(
			data?.error ||
			data?.message ||
			`HTTP ${response.status}`
		);
	}

	return data;
}

export const admin = {
	get(path) {
		return request("GET", path);
	},

	post(path, body = null) {
		return request("POST", path, body);
	},

	put(path, body = null) {
		return request("PUT", path, body);
	},

	delete(path) {
		return request("DELETE", path);
	}
};
