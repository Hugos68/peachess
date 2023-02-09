<script lang="ts">
	import { page } from '$app/stores';
    import { Chess, type Color } from 'chess.js'
	import { onMount } from 'svelte';
    export let chessGame: ChessGame;
    const chess: Chess = new Chess(chessGame.fen);

    const playingColor: Color = $page.data.session.user.id === chessGame.player_id_white ? 'w' : 'b';
    const turnColor: Color = chess.turn();

    const getTileColor = (rowNumber: number, tileNumber: number): string => {
        if (rowNumber%2 === 0) {
            return tileNumber%2 === 0 ? "bg-[var(--chess-light-tile-color)]" : "bg-[var(--chess-dark-tile-color)]";
        }
        else {
            return tileNumber%2 === 0 ? "bg-[var(--chess-dark-tile-color)]" : "bg-[var(--chess-light-tile-color)]";
        }
    }

    let flipped: boolean = playingColor==='b';

    const getArrayOrder = (array: any[]) => {
        return flipped ? array.reverse() : array;
    }
</script>

{#if playingColor===turnColor}
    <p>Your turn</p>
{:else}
    <p>Waiting for {playingColor === 'w' ? "Black" : "White"} to play</p>
{/if}

<button class="btn variant-filled-primary" on:click={() => flipped = !flipped}>Flip Board</button>
<table class="w-[min(75vw,35rem)] aspect-square">
    <tbody>
        {#key flipped}
            {#each getArrayOrder(chess.board()) as rank, i} 
                <tr>
                    {#each getArrayOrder(rank) as tileInfo, j} 
                        <td class="{getTileColor(i, j)} relative">
                            {#if tileInfo !==null}
                                <img class="z-[1] top-0 absolute" src="https://www.chess.com/chess-themes/pieces/neo/150/{tileInfo.color}{tileInfo.type}.png" alt="{tileInfo.color}{tileInfo.type}">
                            {/if}
                            {#if j===0}
                                {#if flipped}
                                    <p class="absolute top-1 left-1">{i+1}</p>
                                {:else}
                                    <p class="absolute top-1 left-1">{8-i}</p>
                                {/if}
                            {/if}
                            {#if i===7}
                                {#if flipped}
                                    <p class="absolute bottom-1 right-1">{String.fromCharCode(96 + (8-j))}</p>
                                {:else}
                                    <p class="absolute bottom-1 right-1">{String.fromCharCode(96 + (j+1))}</p>
                                {/if}
                            {/if}
                        </td>
                    {/each}
                </tr>
            {/each}
        {/key}
    </tbody>
</table>

