<script lang="ts">
    import { Chess } from 'chess.js'
    export let fenState: string;
    const chess = new Chess(fenState);
    const board = chess.board();

    const chessTypeIcon: Record<string, string> = {
        'r': '♜',
        'n': '♞',
        'b': '♝',
        'q': '♛',
        'k': '♚',
        'p': '♟'    
    }
</script>

<div class="mx-auto flex flex-col justify-center items-center gap-4">
    <h1>Chess Board</h1>
    <table class="w-[min(75vw,35rem)] aspect-square">
        <tbody>
            {#each board as rank, i} 
                <tr>
                    {#each rank as tile, j} 
                        <td class="bg-[var(--chess-{i%2 === 0 ? (j%2===0 ? "light" : "dark") : (j%2===0 ? "dark" : "light")}-tile-color)] relative">
                            {#if tile !==null}
                                <p class="text-center !text-[min(7vw,3rem)] {tile.color==='w' ? "text-base-token" : "text-dark-token"} absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
                                    {chessTypeIcon[tile.type]}
                                </p>
                            {/if}
                        </td>
                    {/each}
                </tr>
            {/each}
        </tbody>
    </table>
</div>
