<script lang="ts">
    import { WHITE, BLACK } from 'chess.js';
    import { getPieceName } from "$lib/util";

    export let material: Material;
    export let color: 'w' | 'b';
</script>

<div class="flex h-5 gap-2">
    {#if color === BLACK && material.w.total > material.b.total}
        <p >+{material.w.total - material.b.total}</p>
    {:else if color === WHITE && material.b.total > material.w.total}
        <p >+{material.b.total - material.w.total}</p>
    {/if}
    {#each Object.entries(material[color === WHITE ? BLACK : WHITE].captures).filter(arr => arr[1] > 0).reverse() as [piece, amount]}
        <div style="width: calc(0.5rem + {4*amount}px);" class="flex relative">
            {#each Array(amount) as _, i}
                <div style="left: {i*4-10}px;" class="absolute w-6 aspect-square bg-cover {color===WHITE ? "white" : "black"} {getPieceName(piece)}"></div>
            {/each} 
        </div>
    {:else}
        <p>~</p>
    {/each}
</div>