<script lang="ts">
	import { page } from "$app/stores";
	import OnlineChessBoard from "$lib/components/chess/OnlineChessBoard.svelte";
	import NewGameModal from "$lib/components/modal/NewGameModal.svelte";
	import { createChessStateStore, type ChessStateStore } from "$lib/stores/chess-store";
	import { modalStore, toastStore, type ModalComponent, type ModalSettings, type ToastSettings } from "@skeletonlabs/skeleton";
	import { onMount } from "svelte";
	import { get } from "svelte/store";
	import type { PageData } from "./$types";

    export let data: PageData;
    
    if ($page.url.searchParams.get('message')) {
        const toast: ToastSettings = {
            preset: 'error',
            message: $page.url.searchParams.get('message') || 'Something went wrong',
            autohide: true,
        }
        toastStore.trigger(toast);
    } 

    let mounted: boolean = false;
    const chessStateStores: ChessStateStore[] = [];
    onMount(() => {
        data.chessGames.forEach(chessGame =>  {
            const store = createChessStateStore(chessGame);
            chessStateStores.push(store);
        });
        mounted = true;
    });

    const handleCreateNewGame = () => {
        const modalComponent: ModalComponent = {
		    ref: NewGameModal,
        };
	    const modal: ModalSettings = {
            type: 'component',
            title: 'Create a new game',
            component: modalComponent,
        };
        modalStore.trigger(modal);
    }
</script>

<div class="mt-[5vh] flex flex-col gap-8">
    <div class="flex justify-between items-center gap-4">
        <h1 >Games</h1>
        <button class=" btn btn-sm variant-filled-primary" on:click={handleCreateNewGame}>+ New Game</button>
    </div>

    {#if !mounted}
        <p class="mx-auto my-auto mt-[15vh]">Loading boards...</p>
    {:else}
    <div class="flex flex-wrap gap-8" class:hidden={!mounted}>
        
        {#each chessStateStores as chessStateStore}     
            {@const chessState = get(chessStateStore)}
            <a class="card h-full w-full flex-[25rem] p-4 gap-2 flex flex-col group" href="/games/{chessState.chessGame.id}">
      
                <div class="flex justify-between">
                    <p><strong>Game {chessState.chessGame.id}: {chessState.chess.header()['White']} vs {chessState.chess.header()['Black']}</strong></p>
                    {#if !chessState.chess.isGameOver()}
                        <div class="badge bg-red-400">
                            <div class="w-2 aspect-square rounded-full bg-white"></div>
                            <span class="font-bold">Live</span>
                        </div>
                    {/if}
                </div>
         
                <div class="group-hover:brightness-75 transition-[filter] duration-250">
                    <OnlineChessBoard chessStateStore={chessStateStore} />
                </div>
            </a>
        {/each}
        <div class="flex-[1_0_25rem] p-4 h-0"></div>
    </div>
    {/if}

</div>