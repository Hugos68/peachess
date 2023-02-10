<script lang="ts">
	import type { Chess } from 'chess.js';
	import BoardRank from './BoardRank.svelte';

    export let chess: Chess;
    export let flipped: boolean;
    
    export function flip() {
        flipped = !flipped;
    }
    
    const getArrayOrder = (array: any[]) => {
        return flipped ? array.reverse() : array;
    }
</script>

<table class="w-full aspect-square">
    <tbody>
        {#key flipped}
            {#each getArrayOrder(chess.board()) as rank, i} 
                <BoardRank rank={rank} rankNumber={i} flipped={flipped} />
            {/each}
        {/key}
    </tbody>
</table>

