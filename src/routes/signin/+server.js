import { json } from "@sveltejs/kit";
import kernel from "taleem-kernel";

export async function POST({ request }) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json(
				{ error: "Email and password are required" },
				{ status: 400 }
			);
		}

		const token = await kernel.admin.login(email, password);

		return json({ token });
	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 401 }
		);
	}
}