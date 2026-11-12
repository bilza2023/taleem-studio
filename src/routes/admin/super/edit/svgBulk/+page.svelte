<script>
///home/bilal-tariq/00--TALEEM/taleem/src/routes/admin/edit/svgBulk/+page.svelte
	import { send } from "$lib/send";

	let raw = "";
	let message = "";

	async function submit() {

		const slugs = raw
			.split(/[,\n]+/)
			.map(s => s.trim())
			.filter(Boolean);

		if (!slugs.length) {
			message = "Enter at least one slug";
			return;
		}

		message = "Creating...";

		try {
			const data = await send("svg", "bulkCreate", { slugs });

			message = `Created: ${data.map(s => s.slug).join(", ")}`;
			raw = "";
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	}
</script>

<div class="page">
  <h1>Bulk Create SVGs</h1>

  <form on:submit|preventDefault={submit}>

    <label>
      Slugs (comma or newline separated)
      <textarea class="body" bind:value={raw} placeholder="triangle-abc.svg, right-triangle.svg" required></textarea>
    </label>

    <button type="submit">Bulk Create</button>

  </form>

  {#if message}
    <p class="message">{message}</p>
  {/if}
</div>


<style>
  .page {
    max-width: 800px;
    color: aliceblue;
    margin: 40px auto;
    padding: 0 24px;
    font-family: system-ui, sans-serif;
  }

  h1 { margin-bottom: 30px; }

  form {
    display: grid;
    gap: 18px;
  }

  label {
    display: grid;
    gap: 6px;
    font-weight: 600;
  }

  textarea {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #bbb;
    border-radius: 5px;
    font: inherit;
    font-weight: 400;
    background: white;
  }

  textarea.body {
    min-height: 200px;
    font-family: monospace;
    resize: vertical;
  }

  button {
    width: fit-content;
    padding: 10px 20px;
    border: 0;
    border-radius: 5px;
    background: #222;
    color: white;
    font: inherit;
    cursor: pointer;
  }

  button:hover { background: #444; }

  .message {
    margin-top: 20px;
    padding: 12px;
    background: #eee;
    color: #222;
    border-radius: 5px;
  }
</style>