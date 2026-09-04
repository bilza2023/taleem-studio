// src/lib/server/backend/communication.js

import kernel from "taleem-kernel";
import { requireAdmin } from "./utils/requireAdmin.js";
import { requireUser } from "./utils/requireUser.js";

export async function createCommunication(data, token) {
	const user = await requireUser(token);

	const { librarySlug, type, message, meta } = data;

	return kernel.communication.create({
		userId: user.id,
		librarySlug,
		type,
		message,
		meta,
		initiator: "STUDENT"
	});
}

export async function listForUser(token) {
	const user = await requireUser(token);

	return kernel.communication.list({ userId: user.id });
}

export async function listForLibrary(librarySlug, token) {
	await requireAdmin(token);

	return kernel.communication.list({ librarySlug });
}

export async function listUnanswered(courseSlug, token) {
	await requireAdmin(token);

	return kernel.communication.listUnanswered(courseSlug);
}

export async function respondToCommunication(id, authorResponse, token) {
	await requireAdmin(token);

	return kernel.communication.update(id, {
		authorResponse,
		readAt: new Date()
	});
}

export async function deleteCommunication(id, token) {
	await requireAdmin(token);

	return kernel.communication.delete(id);
}