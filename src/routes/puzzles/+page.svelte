<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
    import ChessGamePanel from "$lib/components/chess/ChessGamePanel.svelte";
	import { createPuzzleChessStateStore } from "$lib/stores/puzzle-chess-store";
	import { modalStore, type ModalComponent, type ModalSettings } from "@skeletonlabs/skeleton";
	import { BLACK, WHITE } from "chess.js";
	import type { Writable } from "svelte/store";
    import type { PageData } from "./$types";

    export let data: PageData
    
    let chessStateStore: Writable<PuzzleChessState> = createPuzzleChessStateStore(data.chessPuzzle)
    
    async function loadNewPuzzle() {
        await invalidateAll();
        chessStateStore = createPuzzleChessStateStore(data.chessPuzzle);
    }

    const openGamePanel = () => {
        const modalComponent: ModalComponent = {
		    ref: ChessGamePanel,
            props: { 
                chessStateStore,
                width: "w-full",
                height: "h-[66vh]"
            },
        };
	    const modal: ModalSettings = {
            type: 'component',
            component: modalComponent,
        };
        modalStore.trigger(modal);
    }
</script>

<div class="mx-auto xl:h-[calc(100vh-2rem)] flex flex-col xl:flex-row justify-center items-center gap-12">

    <div class="flex flex-col gap-2">
        <header class="flex justify-between">
            {#if $chessStateStore.puzzleCompleted}
                <p class="p-2 my-auto rounded-token font-semibold text-center bg-secondary-700">Puzzle Completed</p>
            {:else}
                {@const turn = $chessStateStore.chess.turn()}
                <p
                class="my-auto p-2 rounded-token font-semibold text-center"
                class:text-white={turn===BLACK}
                class:text-black={turn===WHITE}
                class:bg-white={turn===WHITE} 
                class:bg-black={turn===BLACK}
                >{turn===WHITE ? 'White' : 'Black'}'s turn</p>
            {/if}
            <div class="flex flex-col items-end">
                {#if $chessStateStore.puzzleCompleted}
                    <button class="btn variant-filled-primary" on:click={loadNewPuzzle}>Load next puzzle</button>
                {:else}
                    <button class="btn variant-filled-primary" on:click={chessStateStore.showNextMove()}>Reveal Move</button>
                {/if}
            </div>
        </header>

        <div class="overflow-hidden card h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
            <ChessBoard config={$chessStateStore.boardConfig} on:move={(event) => {
                chessStateStore.move(event.detail.from, event.detail.to, event.detail?.promotion);
            }}/>
        </div>
    
        <footer class="flex justify-between items-end">
            <MoveControls {chessStateStore} />
        </footer>
    </div>
    <div class="hidden xl:block">
        <ChessGamePanel height="h-[min(calc(100vw)-1rem,calc(95vh-12rem))]" width="w-full" {chessStateStore} />
    </div>
    
    <button class="btn variant-filled-primary xl:hidden" on:click={openGamePanel}>Open Game Panel</button>
 </div>
