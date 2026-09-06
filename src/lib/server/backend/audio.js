import kernel from 'taleem-kernel';
import { requireAdmin } from './utils/requireAdmin.js';
import { deleteAudioFile } from './utils/deleteAudioFile.js';
import { requireSuperAdmin } from './utils/requireSuperAdmin.js';

export async function createAudio(data, token) {
	await requireAdmin(token);
	return kernel.audio.create(data);
}

export async function getAudio(slug) {
	return kernel.audio.get(slug);
}

export async function listAudio(filters) {
	return kernel.audio.list(filters);
}

export async function updateAudio(slug, data, token) {
	await requireAdmin(token);
	return kernel.audio.update(slug, data);
}

export async function deleteAudio(slug, token) {
	await requireSuperAdmin(token);
	await deleteAudioFile(slug);
	return kernel.audio.delete(slug);
}