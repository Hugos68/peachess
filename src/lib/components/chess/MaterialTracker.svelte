<script lang="ts">
    import { WHITE, BLACK } from 'chess.js';
    import { flip } from "svelte/animate";
	import { scale } from "svelte/transition";
    import { getPieceName } from "$lib/util";
    import type { ChessStateStore } from "$lib/stores/chess-store";

    export let chessStateStore: ChessStateStore;
    export let color: 'w' | 'b';
</script>

<div class="flex h-5 gap-2">
    {#if color === BLACK && $chessStateStore.material.w.total > $chessStateStore.material.b.total}
        <p transition:scale>+{$chessStateStore.material.w.total - $chessStateStore.material.b.total}</p>
    {:else if color === WHITE && $chessStateStore.material.b.total > $chessStateStore.material.w.total}
        <p transition:scale>+{$chessStateStore.material.b.total - $chessStateStore.material.w.total}</p>
    {/if}
    {#each Object.entries($chessStateStore.material[color === WHITE ? BLACK : WHITE].captures).filter(arr => arr[1] > 0).reverse() as [piece, amount] (piece)}
        <div animate:flip={{duration: 150}} style="width: calc(0.5rem + {4*amount}px);" class="flex relative">
            {#each Array(amount) as _, i}
                <div style="left: {i*4-10}px;" class="absolute w-6 aspect-square bg-cover {color===WHITE ? "white" : "black"} {getPieceName(piece)}" in:scale></div>
            {/each} 
        </div>
    {:else}
        <p>~</p>
    {/each}
</div>