import { json } from "@sveltejs/kit";
import kernel from "taleem-kernel";

export async function GET() {
	try {

		const images = await kernel.image.list();

		const svgs = await kernel.svg.list();

		const audios = await kernel.audio.list();


		return json([
			...images.map(asset => ({
				...asset,
				type: "IMAGE"
			})),

			...svgs.map(asset => ({
				...asset,
				type: "SVG"
			})),

			...audios.map(asset => ({
				...asset,
				type: "AUDIO"
			}))
		]);


	} catch (error) {

		console.error("ASSETS ERROR:", error);

		return json(
			{ error: error.message },
			{ status: 500 }
		);
	}
}