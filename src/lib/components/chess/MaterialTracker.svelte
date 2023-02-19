<script lang="ts">
    import { flip } from "svelte/animate";
	import { crossfade, scale } from "svelte/transition";
    import { quintOut } from "svelte/easing";
    import { getPieceName } from "$lib/util";

    export let chessStateStore: ChessStateStore;
    export let color: WHITE | BLACK;
</script>

<div class="flex h-6 gap-2">
    {#if color === 'b' && $chessStateStore.material.w.total > $chessStateStore.material.b.total}
        <p>+{$chessStateStore.material.w.total - $chessStateStore.material.b.total}</p>
    {:else if color === 'w' && $chessStateStore.material.b.total > $chessStateStore.material.w.total}
        <p>+{$chessStateStore.material.b.total - $chessStateStore.material.w.total}</p>
    {/if}
    {#each Object.entries($chessStateStore.material[color === 'w' ? "b" : "w"].captures).filter(arr => arr[1] > 0).reverse() as [piece, amount] (piece)}
        <div animate:flip={{duration: 150}} class="flex relative w-6">
            {#each Array(amount) as _, i}
                <div style="left: {i*4}px;" class="absolute right w-6 aspect-square bg-cover {color==='w' ? "white" : "black"} {getPieceName(piece)}" in:scale></div>
            {/each} 
        </div>
    {/each}
</div>