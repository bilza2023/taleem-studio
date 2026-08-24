import { json } from "@sveltejs/kit";
import { loginAdmin } from "$lib/server/admin.js";

export async function POST({ request }) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json(
				{ error: "Email and password are required" },
				{ status: 400 }
			);
		}

		const token = await loginAdmin(email, password);

		return json({ token });
	} catch (error) {
		console.error(error);

		return json(
			{ error: error.message },
			{ status: 401 }
		);
	}
}