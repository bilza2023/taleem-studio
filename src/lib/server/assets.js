// src/lib/server/assets.js
import kernel from 'taleem-kernel';
import { requireAdmin } from './utils/requireAdmin.js';

export async function listAssets(token) {
	await requireAdmin(token);

	const [images, svgs, audios] = await Promise.all([
		kernel.image.list(),
		kernel.svg.list(),
		kernel.audio.list()
	]);

	return [
		...images.map(asset => ({ ...asset, type: 'IMAGE' })),
		...svgs.map(asset => ({ ...asset, type: 'SVG' })),
		...audios.map(asset => ({ ...asset, type: 'AUDIO' }))
	];
}