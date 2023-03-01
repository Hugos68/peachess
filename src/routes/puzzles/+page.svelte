<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
	import { createPuzzleChessStateStore } from "$lib/stores/puzzle-chess-store";
	import type { Writable } from "svelte/store";
    import type { PageData } from "./$types";

    export let data: PageData
    
    let puzzleChessStateStore: Writable<PuzzleChessState> = createPuzzleChessStateStore(data.chessPuzzle)
    
    async function loadNewPuzzle() {
        await invalidateAll();
        puzzleChessStateStore = createPuzzleChessStateStore(data.chessPuzzle);
    }
</script>

 <div class="mx-auto xl:h-[calc(100vh-2rem)] flex flex-col xl:flex-row justify-center items-center gap-12">    
    <div class="overflow-hidden h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
        <ChessBoard config={$puzzleChessStateStore.boardConfig} on:move={(event) => {
            puzzleChessStateStore.move(event.detail.from, event.detail.to, event.detail.promotion);
        }}/>
    </div>
    <MoveControls chessStateStore={puzzleChessStateStore} />
    <div class=" overflow-hidden card h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))] flex items-center justify-center">
        {#if $puzzleChessStateStore.puzzleCompleted}  
            <div class="flex flex-col justify-center items-center gap-4">
                <p>Puzzle completed, nice job!</p>
                <button class="btn variant-filled-primary" on:click={loadNewPuzzle}>Next Puzzle</button>
            </div>
        {:else}
            <div class="flex flex-col justify-center items-center gap-4">
                {#key $puzzleChessStateStore.chess}  
                    <p>{$puzzleChessStateStore.chess.turn()==='w' ? "White" : "Black"} to move</p>
                {/key}
                <button class="btn variant-filled-primary" on:click={puzzleChessStateStore.showNextMove()}>Show Next Move</button>
            </div>
        {/if}
    </div>
</div>
