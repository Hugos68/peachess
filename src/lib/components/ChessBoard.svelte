<script lang="ts">
    import { Chess } from 'chess.js'
	import { onMount } from 'svelte';
    export let fenState: string;
    export let sidePlaying: string;
    const chess = new Chess(fenState);
    
    const getTileColor = (rowNumber: number, tileNumber: number): string => {
        if (rowNumber%2 === 0) {
            return tileNumber%2===0 ? "bg-[var(--chess-light-tile-color)]" : "bg-[var(--chess-dark-tile-color)]";
        }
        else {
            return tileNumber%2===0 ? "bg-[var(--chess-dark-tile-color)]" : "bg-[var(--chess-light-tile-color)]";
        }
    }

    let flipped: boolean = false;
    onMount(() => {
        if (sidePlaying==="black") flipped = !flipped;
    })
    
</script>


<table class="w-[min(75vw,35rem)] aspect-square chess-board" class:rotate-180={flipped}>
    <tbody>
        {#each chess.board() as rank, i} 
            <tr>
                {#each rank as tileInfo, j} 
                    <td class="{getTileColor(i, j)} relative chess-board-square">
                        {#if tileInfo !==null}
                            <img class="z-[1] top-0 absolute" class:rotate-180={flipped} src="https://www.chess.com/chess-themes/pieces/neo/150/{tileInfo.color}{tileInfo.type}.png" alt="{tileInfo.color}{tileInfo.type}">
                        {/if}
                    </td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>

