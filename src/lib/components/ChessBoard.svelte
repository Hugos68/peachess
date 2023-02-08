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
            return tileNumber%2===0 ? "bg-[var(--chess-light-tile-color)]" : "bg-[var(--chess-dark-tile-color)]";
        }
        else {
            return tileNumber%2===0 ? "bg-[var(--chess-dark-tile-color)]" : "bg-[var(--chess-light-tile-color)]";
        }
    }

    let flipped: boolean = false;
    onMount(() => {
        if (playingColor==='b') flipped = !flipped;
    });
</script>

{#if playingColor===turnColor}
    <p>Your turn</p>
{:else}
    <p>Waiting for {playingColor === 'w' ? "Black" : "White"} to play</p>
{/if}
<table class="w-[min(75vw,35rem)] aspect-square" class:rotate-180={flipped}>
    <tbody>
        {#each chess.board() as rank, i} 
            <tr>
                {#each rank as tileInfo, j} 
                    <td class="{getTileColor(i, j)} relative">
                        {#if tileInfo !==null}
                            <img class="z-[1] top-0 absolute" class:rotate-180={flipped} src="https://www.chess.com/chess-themes/pieces/neo/150/{tileInfo.color}{tileInfo.type}.png" alt="{tileInfo.color}{tileInfo.type}">
                        {/if}
                    </td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>

