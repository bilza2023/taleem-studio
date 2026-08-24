
<script>
  import { onMount } from 'svelte';

  let assets = [];
  let filtered = [];
  let search = '';
  let type = 'ALL';
  let page = 1;
  const perPage = 30;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const res = await fetch('/assets');
      if (!res.ok) throw new Error('Failed to load assets');
      assets = await res.json();
      filter();
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });

  function filter() {
    const q = search.toLowerCase().trim();

    filtered = assets.filter((asset) => {
      const matchesType = type === 'ALL' || asset.type === type;
      const tags = Array.isArray(asset.tags) ? asset.tags.join(' ') : asset.tags || '';
      const text = `${asset.slug} ${asset.title} ${tags}`.toLowerCase();
      return matchesType && (!q || text.includes(q));
    });

    page = 1;
  }

  $: totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  $: if (page > totalPages) page = totalPages;
  $: visible = filtered.slice((page - 1) * perPage, page * perPage);
</script>

<div class="page">
  <div class="header">
    <h1>Assets</h1>

    <div class="filters">
      <input
        bind:value={search}
        on:input={filter}
        placeholder="Search slug, title or tags..."
      />

      <select bind:value={type} on:change={filter}>
        <option value="ALL">All</option>
        <option value="IMAGE">Images</option>
        <option value="SVG">SVG</option>
      </select>
    </div>
  </div>

  {#if loading}
    <p>Loading...</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else if visible.length === 0}
    <p>No assets found.</p>
  {:else}
    <div class="count">
      {filtered.length} assets
    </div>

    <div class="grid">
      {#each visible as asset}
        <article class="card">
          <div class="preview">
            {#if asset.type === 'SVG'}
              {@html asset.body}
            {:else}
              <div class="image-placeholder">IMAGE</div>
            {/if}
          </div>

          <div class="info">
            <strong>{asset.slug}</strong>

            {#if asset.title}
              <span>{asset.title}</span>
            {/if}

            <small>{asset.type}</small>

            {#if asset.tags}
              <small>{asset.tags}</small>
            {/if}
          </div>

          <div class="actions">
            <button>Edit</button>
            <button>Delete</button>
          </div>
        </article>
      {/each}
    </div>

    <div class="pagination">
      <button on:click={() => page--} disabled={page === 1}>
        ← Previous
      </button>

      <span>Page {page} of {totalPages}</span>

      <button on:click={() => page++} disabled={page === totalPages}>
        Next →
      </button>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 1200px;
    margin: 40px auto;
    padding: 0 24px;
    color: aliceblue;
    font-family: system-ui, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 25px;
  }

  .filters {
    display: flex;
    gap: 10px;
  }

  input, select {
    padding: 10px 12px;
    border: 1px solid #aaa;
    border-radius: 5px;
    font: inherit;
  }

  input {
    width: 320px;
  }

  .count {
    margin-bottom: 15px;
    opacity: .7;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 18px;
  }

  .card {
    overflow: hidden;
    border: 1px solid #444;
    border-radius: 7px;
    background: #181818;
  }

  .preview {
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 15px;
    background: white;
    color: #111;
  }

  .preview :global(svg) {
    max-width: 100%;
    max-height: 140px;
  }

  .image-placeholder {
    color: #777;
  }

  .info {
    display: grid;
    gap: 5px;
    padding: 12px;
  }

  .info strong {
    overflow-wrap: anywhere;
  }

  .info small {
    opacity: .65;
  }

  .actions {
    display: flex;
    gap: 8px;
    padding: 0 12px 12px;
  }

  button {
    padding: 7px 12px;
    border: 0;
    border-radius: 4px;
    cursor: pointer;
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 20px;
    margin: 30px 0;
  }

  .pagination button:disabled {
    opacity: .4;
    cursor: default;
  }

  .error {
    color: #ff7777;
  }
</style>