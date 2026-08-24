import { json } from '@sveltejs/kit';
import kernel from 'taleem-kernel';

export async function GET() {
	try {
		// console.log("ASSETS: starting");

		const images = await kernel.image.list();
		// console.log("ASSETS: images", images.length);

		const svgs = await kernel.svg.list();
		// console.log("ASSETS: svgs", svgs.length);

		return json([
			...images.map(asset => ({ ...asset, type: 'IMAGE' })),
			...svgs.map(asset => ({ ...asset, type: 'SVG' }))
		]);
	} catch (error) {
		console.error("ASSETS ERROR:", error);
		return json({ error: error.message }, { status: 500 });
	}
}