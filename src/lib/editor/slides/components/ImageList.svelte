<!-- /src/lib/editor/ImageList.svelte -->

<script>
    import { onMount } from "svelte";
    import apiFetch from "$lib/utils/fetch";

    export let image = "";
    export let onUse = () => {};

    let files = [];

    onMount(async () => {
        try {
            files = await apiFetch("GET", "/media/image");
        }
        catch (err) {
            console.error(err);
        }
    });
</script>

<select
    value={image}
    on:change={(e) => onUse(e.currentTarget.value)}
>
    <option value="">Select image...</option>

    {#each files as file}
        <option value={file.filename}>
            {file.filename}
        </option>
    {/each}
</select>
<style>
    select {
        width: 260px;
        height: 32px;
        padding: 4px 8px;
        box-sizing: border-box;
        border: 1px solid var(--theme-border);
        border-radius: 5px;
        background: color-mix(in srgb, var(--theme-panel) 90%, black);
        color: var(--theme-text);
        font-size: 12px;
        cursor: pointer;
    }

    select:focus {
        outline: none;
        border-color: var(--theme-accent);
    }
</style>