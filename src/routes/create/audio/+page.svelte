<script>
  import { config } from '$lib/config.js';

  let file;
  let title = '';
  let tags = '';
  let message = '';

  async function submit() {
    if (!file) {
      message = 'Please select an audio file.';
      return;
    }

    message = 'Uploading...';

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('title', title);
      data.append('tags', tags);

      const res = await fetch(`${config.apiUrl}create/audio`, {
        method: 'POST',
        body: data
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      message = `Created: ${result.slug}`;
    } catch (error) {
      console.error(error);
      message = `Error: ${error.message}`;
    }
  }
</script>

<div class="page">
  <h1>Create Audio</h1>

  <form on:submit|preventDefault={submit}>
    <label>
      Audio
      <input
        type="file"
        accept="audio/*"
        on:change={(e) => file = e.currentTarget.files[0]}
        required
      >
    </label>

    <label>
      Title
      <input bind:value={title}>
    </label>

    <label>
      Tags
      <input bind:value={tags} placeholder="algebra, introduction, chapter-1">
    </label>

    <button type="submit">Upload Audio</button>
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

  input {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #bbb;
    border-radius: 5px;
    font: inherit;
    background: white;
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