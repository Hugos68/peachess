<script lang="ts">
	import { BLACK, WHITE } from "chess.js";
    import type { PageData } from "./$types";
    import { createAIChessStateStore } from "$lib/stores/chess-store";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
    import MaterialTracker from "$lib/components/chess/MaterialTracker.svelte";
	import ChessBoardSidePanel from "$lib/components/chess/ChessInfoPanel.svelte";
	import type { Writable } from "svelte/store";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import { modalStore, type ModalComponent, type ModalSettings } from "@skeletonlabs/skeleton";
	import ChessInfoPanel from "$lib/components/chess/ChessInfoPanel.svelte";
	import { getAIDifficulityByName } from "$lib/util";
	import ChessBoardInclusive from "$lib/components/chess/ChessBoardInclusive.svelte";
    
    export let data: PageData;

    const chessStateStore: Writable<AIChessState> = createAIChessStateStore(getAIDifficulityByName(data.name) as 0 | 1 | 2 | 3 | 4, 'w');

        const openGamePanel = () => {
        const modalComponent: ModalComponent = {
		    ref: ChessInfoPanel,
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

    <ChessBoardInclusive {chessStateStore} />

    <div class="hidden xl:block">
        <ChessBoardSidePanel height="h-[min(calc(100vw)-1rem,calc(95vh-12rem))]" width="w-[min(calc(100vw)-1rem,calc(95vh-12rem))]" {chessStateStore} />
    </div>

    <button class="btn variant-filled-primary xl:hidden" on:click={openGamePanel}>Open Game Panel</button>
 </div>