<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import NewGameModal from "$lib/components/modal/NewGameModal.svelte";
	import { createOnlineChessStateStore} from "$lib/stores/online-chess-store";
	import { modalStore, Paginator, popup, ProgressRadial, toastStore, type ModalComponent, type ModalSettings, type PopupSettings, type ToastSettings } from "@skeletonlabs/skeleton";
	import { get } from "svelte/store";
	import type { PageData } from "./$types";
	import { getPlayingColor } from "$lib/util";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";

    export let data: PageData;
    
    if ($page.url.searchParams.get('message')) {
        const toast: ToastSettings = {
            background: 'error',
            message: $page.url.searchParams.get('message') || 'Something went wrong',
            autohide: true,
        }
        toastStore.trigger(toast);
    } 

    const openNewGameModal = () => {
        const modalComponent: ModalComponent = {
		    ref: NewGameModal,
        };
	    const modal: ModalSettings = {
            type: 'component',
            component: modalComponent,
        };
        modalStore.trigger(modal);
    }
    
    let loading: boolean = false;
    const loadPage = async (e: CustomEvent) => {
        loading = true;
        const query = new URLSearchParams($page.url.searchParams);
        query.set('page', e.detail);
        await goto(`?${query.toString()}`);
        loading = false;
    }

    let pageProps = {
        offset: 0,
        limit: data.chessGames.length,
        // We do plus one because our db is one-based and pagination is zero-based
        size: data.totalChessGameAmount ? data.totalChessGameAmount + 1 : 1,
        amounts: [data.chessGames.length],
    };


    const chessGameBoardConfigMap: Map<OnlineChessGame, OnlineChessState> = new Map();
    data.chessGames.forEach(chessGame => {
        const playingColor = getPlayingColor(chessGame, $page.data.session) || 'w';
        const onlineChessStateStore = createOnlineChessStateStore(chessGame, playingColor);
        chessGameBoardConfigMap.set(chessGame, get(onlineChessStateStore));
    });

    let notLoggedInPopup: PopupSettings = {
        // Set the event as: click | hover | hover-click
        event: 'hover',
        target: 'not-logged-in-popup'
    };
</script>

<div class="mt-[5vh] flex flex-col gap-8">
    <div class="flex justify-between items-center gap-4">
        <h1 >Games</h1>
        <button class="btn btn-sm variant-filled-primary" on:click={openNewGameModal} disabled={!$page.data.session} use:popup={notLoggedInPopup}>+ New Game</button>
        <div class="card variant-filled-secondary" data-popup="not-logged-in-popup">
            {#if !$page.data.session}
                <p class="p-4">You need to be logged in in order to play a game.</p>
                <div class="arrow variant-filled-secondary" />
            {/if}
        </div>
    </div>

    {#if loading}
        <ProgressRadial stroke={128} class="w-8 mx-auto mt-[5vh]" font={16} value={undefined} />
    {/if}
    <div class="flex flex-wrap gap-8">
        {#each [...chessGameBoardConfigMap] as [chessGame, onlineChessState]}     
            <a class="card bg-surface-300-600-token h-full w-full flex-[20rem] p-4 gap-2 flex flex-col group" href="/games/{chessGame.id}" class:hidden={loading} data-sveltekit-preload-data="hover">

                <div class="flex justify-between">
                    <p><strong>Game {chessGame.id}: {onlineChessState.chess.header()['White']} vs {onlineChessState.chess.header()['Black']}</strong></p>
                    {#if !onlineChessState.chess.isGameOver()}
                        <div class="badge bg-red-400">
                            <div class="w-2 aspect-square rounded-full bg-white"></div>
                            <span class="font-bold">Live</span>
                        </div>
                    {/if}
                </div>
         
                <div class="group-hover:brightness-75 transition-[filter] duration-250">
                    <ChessBoard config={onlineChessState.boardConfig} />
                </div>

                {#if loading}
                    <p class="h-full w-full flex-1">Loading board</p>
                {/if}
            </a>
        {:else}
        <p class="text-center mt-[5vh]">You've reached the end</p>
        {/each}
        <div class="flex-[1_0_20rem] h-0"></div>
        <div class="flex-[1_0_20rem] h-0"></div>
        <div class="flex-[1_0_20rem] h-0"></div>
    </div>
    <Paginator bind:settings={pageProps} on:page={loadPage} />
</div>