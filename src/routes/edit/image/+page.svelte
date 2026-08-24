<script>
	import { config } from "$lib/config";

	let file;
	let title = "";
	let tags = "";
	let message = "";

	async function submit() {
		if (!file) {
			message = "Please select an image.";
			return;
		}

		message = "Uploading...";

		try {
			const data = new FormData();
			data.append("file", file);
			data.append("title", title);
			data.append("tags", tags);

			const token = localStorage.getItem("taleem-admin-token");

			const res = await fetch(
				`${config.apiUrl}/create/image`,
				{
					method: "POST",
					headers: token
						? { Authorization: `Bearer ${token}` }
						: {},
					body: data
				}
			);

			const result = await res.json();

			if (!res.ok) {
				throw new Error(result.error || "Upload failed");
			}

			message = `Created: ${result.slug}`;
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	}
</script>