<script lang="ts">
    import { flip } from "svelte/animate";
	import { crossfade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { getPieceName } from "$lib/util";

    export let chessStateStore: ChessStateStore;
    export let color: WHITE | BLACK;
</script>

<div class="flex h-5 gap-2">
    {#if color === 'b' && $chessStateStore.material.w.total > $chessStateStore.material.b.total}
        <p>+{$chessStateStore.material.w.total - $chessStateStore.material.b.total}</p>
    {:else if color === 'w' && $chessStateStore.material.b.total > $chessStateStore.material.w.total}
        <p>+{$chessStateStore.material.b.total - $chessStateStore.material.w.total}</p>
    {/if}
    {#each Object.entries($chessStateStore.material[color === 'w' ? "b" : "w"].captures).filter(arr => arr[1] > 0).reverse() as [piece, amount] (piece)}
        <div animate:flip={{duration: 150}} style="width: calc(0.5rem + {4*amount}px);" class="flex  relative">
            {#each Array(amount) as _, i}
                <div style="left: {i*4-10}px;" class="absolute w-6 aspect-square bg-cover {color==='w' ? "white" : "black"} {getPieceName(piece)}" in:scale></div>
            {/each} 
        </div>
    {/each}
</div>