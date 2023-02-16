<script lang="ts">
	import { goto, invalidate } from "$app/navigation";
	import { page } from "$app/stores";
	import { supabase } from "$lib/supabase";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
	import { Chess } from "chess.js";
	import { Chessground } from "chessground";
	import { onMount } from "svelte";
	import type { PageData } from "./$types";

    export let data: PageData;
    const chessGameChessMap: Map<number, Chess> = new Map();
    let mounted: boolean = false;
    onMount(() => {
        const chessGames: ChessGame[] = data.chessGames;
        chessGames.forEach(chessGame => {
            const chess: Chess = new Chess();
            chess.loadPgn(chessGame.pgn);
            Chessground(document.getElementById(`board${chessGame.id}`) as HTMLElement, {
                fen: chess.fen(),
                viewOnly: true
            });
            chessGameChessMap.set(chessGame.id, chess);
        });
        mounted = true;
    })

    if ($page.url.searchParams.get('message')) {
        const t: ToastSettings = {
            preset: 'error',
            message: $page.url.searchParams.get('message') || 'Something went wrong',
            autohide: true,
        }
        toastStore.trigger(t);
    }   

    let opponentUsername: string;

    const createGame = async () => {
        const {data, error} = await supabase.functions.invoke('create_game',  {
            body: JSON.stringify({ opponentUsername: opponentUsername })
        });
        if (data)  {
            const t: ToastSettings = {
                    message: 'Succesfully created game',
                    preset: 'success',
                    autohide: true
                }
                toastStore.trigger(t);
            await goto(`/games/${data.game.id}`);
        }
    }

    const refreshGames = () => {
        invalidate('app:games');
    }

    const getPlayerNameByGameAndColor = (id: number, color: 'White' | 'Black') => {
        const chess: Chess | undefined = chessGameChessMap.get(id)
        return chess?.header()[color];
    }
</script>


<div class="mt-[5vh] flex flex-col gap-8">
    <h1 >Games</h1>
    <div class="ml-auto w-min flex gap-4">
        <button class=" btn btn-sm variant-filled-primary" on:click={createGame}>+ New Game</button>
        <button class="btn btn-sm variant-filled-tertiary" on:click={refreshGames}>Refresh</button>
    </div>

    <div class="mx-auto flex flex-wrap gap-8">
        {#each data.chessGames as chessGame}
            <a class="card card-hover w-full h-full max-w-[30rem] p-2" href="/games/{chessGame.id}">
                {#if mounted}
                    <p class="font-bold p-3">Game {chessGame.id}: {getPlayerNameByGameAndColor(chessGame.id, 'White')} VS {getPlayerNameByGameAndColor(chessGame.id, 'Black')}</p>
                {/if}
                <div class="pointer-events-none" id="board{chessGame.id}"></div>
            </a>
        {/each}
    </div>
</div>
