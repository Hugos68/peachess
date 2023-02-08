<script lang="ts">
    import { Chess } from 'chess.js'
    export let fenState: string;
    const chess = new Chess(fenState);
    
    const getTileColor = (rowNumber: number, tileNumber: number): string => {
        if (rowNumber%2 === 0) {
            return tileNumber%2===0 ? "bg-[var(--chess-light-tile-color)]" : "bg-[var(--chess-dark-tile-color)]";
        }
        else {
            return tileNumber%2===0 ? "bg-[var(--chess-dark-tile-color)]" : "bg-[var(--chess-light-tile-color)]";
        }
    }
    
</script>

<div class="mx-auto flex flex-col justify-center items-center gap-4">
    <h1>Chess Board</h1>
    <table class="w-[min(75vw,35rem)] aspect-square">
        <tbody>
            {#each chess.board() as rank, i} 
                <tr>
                    {#each rank as tile, j} 
                        <td class="{getTileColor(i, j)} relative">
                            {#if tile !==null}
                                <img class="z-[1] top-0 absolute" src="https://www.chess.com/chess-themes/pieces/neo/150/{tile.color}{tile.type}.png">
                            {/if}
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>
