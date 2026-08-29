<script>
	import { frontend } from "$lib/frontEnd";

	let form = {
		slug: "",
		title: "",
		body: "",
		tags: "[]"
	};

	let message = "";

	async function submit() {
		message = "Saving...";

		try {
			const data = await frontend.svg.create(form);

			message = `Created: ${data.slug}`;
		} catch (error) {
			console.error(error);
			message = `Error: ${error.message}`;
		}
	}
</script>
<div class="page">
  <h1>Create SVG</h1>

  <form on:submit|preventDefault={submit}>
    <label>
      Slug
      <input bind:value={form.slug} required>
    </label>

    <label>
      Title
      <input bind:value={form.title} required>
    </label>

    <label>
      Tags
      <input bind:value={form.tags} placeholder='["number-line","math"]'>
    </label>

    <label>
      SVG
      <textarea class="body" bind:value={form.body} required></textarea>
    </label>

    <button type="submit">Create SVG</button>
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

  input, textarea {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #bbb;
    border-radius: 5px;
    font: inherit;
    font-weight: 400;
    background: white;
  }

  textarea {
    min-height: 90px;
    resize: vertical;
  }

  textarea.body {
    min-height: 400px;
    font-family: monospace;
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