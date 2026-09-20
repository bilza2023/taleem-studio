<script>
///home/bilal-tariq/00--TALEEM/taleem.help/src/lib/taleem-slides/templates/eq/EqSidePanel.svelte
    import Math from "../../utils/Math.svelte";

    export let currentLine = null;

    $: textItems = currentLine?.spItems?.filter(item => item.type === "text") ?? [];
    $: mathItems = currentLine?.spItems?.filter(item => item.type === "math") ?? [];
    $: imageItems = currentLine?.spItems?.filter(item => item.type === "image") ?? [];
</script>

{#if currentLine?.spItems?.length}
    <div class="sidePanel">
        <div class="left">
            {#each textItems as item}
                <div class="spCard spText">
                    {item.content}
                </div>
            {/each}

            {#each mathItems as item}
                <div class="spCard spMath">
                    <Math tex={item.content} displayMode={true}/>
                </div>
            {/each}
        </div>

        <div class="right">
            {#each imageItems as item}
                <img class="spImage" src={item.content} alt="" />
            {/each}
        </div>
    </div>
{/if}
<style>
.sidePanel{
    width:100%;
    box-sizing:border-box;
    margin:0 0 14px;
    padding:
        max(4px, calc(var(--base-font)*.35))
        max(8px, calc(var(--base-font)*.6))
        max(5px, calc(var(--base-font)*.4))
        max(16px, calc(var(--base-font)*1.45));
    display:grid;
    grid-template-columns:minmax(0,58%) minmax(0,42%);
    gap:max(4px, calc(var(--base-font)*.5));
    background:color-mix(in srgb,var(--player-surface) 85%,var(--player-text) 15%);
    border-bottom:3px solid #ef4444;
    border-top:0;
    border-left:max(3px, calc(var(--base-font)*.2)) solid var(--player-primary);
    border-radius:0 0 12px 12px;
    box-shadow:0 0 0 1px rgba(255,255,255,.04) inset,0 8px 18px rgba(0,0,0,.12);
    backdrop-filter:blur(6px);
    color:var(--player-text);
}

.left{
    min-width:0;
    display:flex;
    flex-direction:column;
    gap:10px;
    justify-content:center;
}

.right{
    min-width:0;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:10px;
    overflow:hidden;
}

.spCard{
    box-sizing:border-box;
    width:100%;
    padding:
        max(5px, calc(var(--base-font)*.3))
        max(7px, calc(var(--base-font)*.4));
    border-radius:9px;
    background:var(--player-surface);
    border:1px solid var(--player-border);
    box-shadow:0 2px 8px rgba(0,0,0,.12);
    color:var(--player-text);
}

.spText{
    font-size:max(11px, calc(var(--base-font)*.5));
    line-height:1.3;
    font-weight:500;
}

.spMath{
    min-height:max(28px, calc(var(--base-font)*1.6));
    display:flex;
    align-items:center;
    justify-content:center;
    overflow:hidden;
}

.spMath :global(.katex-display){
    margin:0;
}

.spMath :global(.katex){
    font-size:max(11px, calc(var(--base-font)*.5));
    color:var(--player-text);
}

.spImage{
    display:block;
    width:100%;
    max-width:100%;
    max-height:300px;
    height:auto;
    object-fit:contain;
    border-radius:10px;
}

/* Mobile: layout shape only, sizing is now handled by --base-font above */
@media(max-width:700px){
    .sidePanel{
        grid-template-columns:1fr;
    }

    .right{
        max-height:110px;
    }

    .spImage{
        max-height:105px;
        width:auto;
        max-width:100%;
    }
}
</style>