<script lang="ts">
	import { page } from "$app/stores";
	import NewGameModal from "$lib/components/modal/NewGameModal.svelte";
	import { supabase } from "$lib/supabase";
	import { modalStore, toastStore, type ModalComponent, type ModalSettings, type ToastSettings } from "@skeletonlabs/skeleton";
	import type { RealtimeChannel } from "@supabase/supabase-js";
	import { Chess } from "chess.js";
	import { Chessground } from "chessground";
	import { onDestroy, onMount } from "svelte";
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
    const channels: RealtimeChannel[] = [];
    let chessGameChessObjectMap: Map<number, Chess> = new Map();
    onMount(() => {
        data.chessGames.forEach(chessGame => {
            const chess = new Chess();
            chess.loadPgn(chessGame.pgn);

            const chessBoard = Chessground(document.getElementById(`board${chessGame.id}`) as HTMLElement, {
                fen: chess.fen(),
                viewOnly: true
            });
            chessGameChessObjectMap.set(chessGame.id, chess);

            // Only open a channel when the game is ongoing 
            if (!chess.isGameOver()) {
                const channel = supabase
                .channel('table-db-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'games',
                    },
                    // This callback is called whenever this game gets an update, payload contains the old and new version
                    (payload) => {
                        const updatedChessGame: ChessGame = payload.new as ChessGame;
                        chess.loadPgn(updatedChessGame.pgn);
                        chessBoard.set({
                            fen: chess.fen(),
                            viewOnly: true
                        });
                    }
                )
                .subscribe();
                channels.push(channel);
            }
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

    onDestroy(() => {
        channels.forEach(channel => {
            channel.unsubscribe();
        })
    });
</script>

<div class="mt-[5vh] flex flex-col gap-8">
    <div class="flex justify-between items-center gap-4">
        <h1 >Games</h1>
        <button class=" btn btn-sm variant-filled-primary" on:click={handleCreateNewGame}>+ New Game</button>
    </div>

    {#if !mounted}
        <p class="mx-auto my-auto mt-[15vh]">Loading boards...</p>
    {/if}
    <div class="flex flex-wrap gap-8" class:hidden={!mounted}>
        {#each data.chessGames as chessGame} 
            <a class="card h-full w-full flex-[25rem] p-4 flex flex-col group" href="/games/{chessGame.id}">
                {#if mounted} 
                <div class="pb-4 flex justify-between">
                    <p class="font-bold">Game {chessGame.id}: {chessGameChessObjectMap.get(chessGame.id)?.header()['White']} vs {chessGameChessObjectMap.get(chessGame.id)?.header()['Black']}</p>
                    {#if !chessGameChessObjectMap.get(chessGame.id)?.isGameOver()}
                        <div class="badge bg-red-400">
                            <div class="w-2 aspect-square rounded-full bg-white"></div>
                            <span class="font-bold">Live</span>
                        </div>
                      
                     
                    {/if}
                </div>
                {/if}
                <div class="group-hover:brightness-75 transition-[filter] duration-250" id="board{chessGame.id}"></div>
            </a>
        {/each}
        <div class="flex-[1_0_25rem] p-4 h-0"></div>
    </div>
</div>