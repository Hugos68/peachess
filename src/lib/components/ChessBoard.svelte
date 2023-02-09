<script lang="ts">
	import type { Chess } from "chess.js";

    export let chess: Chess;
    export let flipped: boolean;
    
    export function flip() {
        flipped = !flipped;
    }

    const getTileColor = (rowNumber: number, tileNumber: number): string => {
        if (rowNumber%2 === 0) {
            return tileNumber%2 === 0 ? "bg-[var(--chess-light-tile-color)]" : "bg-[var(--chess-dark-tile-color)]";
        }
        else {
            return tileNumber%2 === 0 ? "bg-[var(--chess-dark-tile-color)]" : "bg-[var(--chess-light-tile-color)]";
        }
    }

    const getArrayOrder = (array: any[]) => {
        return flipped ? array.reverse() : array;
    }
</script>

<table class="w-[min(75vw,35rem)] aspect-square">
    <tbody>
        {#key flipped}
            {#each getArrayOrder(chess.board()) as rank, i} 
                <tr>
                    {#each getArrayOrder(rank) as tileInfo, j} 
                        <td class="{getTileColor(i, j)} relative text-base-token">
                            {#if tileInfo !==null}
                                <img class="z-[1] top-0 absolute" src="https://www.chess.com/chess-themes/pieces/neo/150/{tileInfo.color}{tileInfo.type}.png" alt="{tileInfo.color}{tileInfo.type}">
                            {/if}
                            {#if j===0 && flipped}
                                <p class="absolute top-1 left-1">{i+1}</p>
                            {:else if j===0}
                                <p class="absolute top-1 left-1">{8-i}</p>
                            {/if}
                            {#if i===7 && flipped}
                                <p class="absolute bottom-1 right-1">{String.fromCharCode(96 + (8-j))}</p>
                            {:else if i===7  }
                                <p class="absolute bottom-1 right-1">{String.fromCharCode(96 + (j+1))}</p>
                            {/if}
                        </td>
                    {/each}
                </tr>
            {/each}
        {/key}
    </tbody>
</table>

