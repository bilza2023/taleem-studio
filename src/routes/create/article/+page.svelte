
<script>
  let form = {
    slug: '',
    title: '',
    description: '',
    thumbnail: '',
    body: '',
    courseSlug: '',
    groupSlug: '',
    sortOrder: 0,
    allowCommunication: true,
    meta: ''
  };

  let message = '';

  async function submit() {
    message = 'Saving...';

    try {
      const res = await fetch('/create/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed');

      message = `Created: ${data.slug}`;
    } catch (error) {
      console.error(error);
      message = `Error: ${error.message}`;
    }
  }
</script>

<div class="page">
  <h1>Create Article</h1>

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
      Description
      <textarea bind:value={form.description}></textarea>
    </label>

    <label>
      Thumbnail
      <input bind:value={form.thumbnail}>
    </label>

    <label>
      Body
      <textarea class="body" bind:value={form.body}></textarea>
    </label>

    <label>
      Course Slug
      <input bind:value={form.courseSlug} required>
    </label>

    <label>
      Group Slug
      <input bind:value={form.groupSlug} required>
    </label>

    <label>
      Sort Order
      <input type="number" bind:value={form.sortOrder}>
    </label>

    <label class="check">
      <input type="checkbox" bind:checked={form.allowCommunication}>
      Allow Communication
    </label>

    <label>
      Meta
      <textarea bind:value={form.meta}></textarea>
    </label>

    <button type="submit">Create Article</button>
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
    min-height: 300px;
    font-family: monospace;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 400;
  }

  .check input {
    width: auto;
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