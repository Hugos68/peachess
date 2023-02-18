<script lang="ts">
	import { page } from "$app/stores";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import { createChessGameStore } from "$lib/stores";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
	import  { WHITE, BLACK } from "chess.js";
	import type { PageData } from "./$types";

    export let data: PageData;
    
    const chessGamechessStoreMap: Map<ChessGame, any> = new Map();

    data.chessGames.forEach(chessGame => {
        const chessStore = createChessGameStore();
        chessStore.loadGame(chessGame);
        chessGamechessStoreMap.set(chessGame, chessStore);
    });
    
    if ($page.url.searchParams.get('message')) {
        const t: ToastSettings = {
            preset: 'error',
            message: $page.url.searchParams.get('message') || 'Something went wrong',
            autohide: true,
        }
        toastStore.trigger(t);
    }   

    const getPlayerNameByGameAndColor = (chessGame: ChessGame, color: 'w' | 'b') => {
        const chessStore = chessGamechessStoreMap.get(chessGame);
        return $chessStore.header()[color === 'w' ? 'White' : 'Black'];
    }
</script>


<div class="mt-[5vh] flex flex-col gap-8">
    <h1 >Games</h1>
    <div class="ml-auto w-min flex gap-4">
        <button class=" btn btn-sm variant-filled-primary">+ New Game</button>
    </div>
    <div class="flex flex-wrap gap-8">
        {#each data.chessGames as chessGame}
            <p>Game {chessGame.id}: {getPlayerNameByGameAndColor(chessGame, WHITE)} VS {getPlayerNameByGameAndColor(chessGame, BLACK)}</p>
            <a class="card card-hover flex-[30rem] p-2" href="/games/{chessGame.id}">
                <ChessBoard chessStore={chessGamechessStoreMap.get(chessGame)} playingSide="white" />
            </a>
        {/each}
    </div>
</div>
