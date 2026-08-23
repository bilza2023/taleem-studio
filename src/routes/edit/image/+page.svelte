<script>
  let file;
  let title = '';
  let tags = '';
  let message = '';

  async function submit() {
    if (!file) {
      message = 'Please select an image.';
      return;
    }

    message = 'Uploading...';

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('title', title);
      data.append('tags', tags);

      const res = await fetch('/admin/create/image', {
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
  <h1>Create Image</h1>

  <form on:submit|preventDefault={submit}>
    <label>
      Image
      <input
        type="file"
        accept="image/*"
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
      <input bind:value={tags} placeholder="math, number-line, chapter-1">
    </label>

    <button type="submit">Upload Image</button>
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
    font-weight: 400;
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