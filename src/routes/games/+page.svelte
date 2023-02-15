<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { supabase } from "$lib/supabase";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
	import { Chess } from "chess.js";
	import { Chessground } from "chessground";
	import { onMount } from "svelte";
	import type { PageData } from "./$types";

    export let data: PageData;
    const chessGameChessObjects: Map<number, Chess> = new Map();
    let mounted: boolean = false;
    onMount(() => {
        data.chessGames.forEach(chessGame => {
            const chess: Chess = new Chess();
            chess.loadPgn(chessGame.pgn);
            Chessground(document.getElementById(`board${chessGame.id}`) as HTMLElement, {
                fen: chess.fen(),
                viewOnly: true
            });
            chessGameChessObjects.set(chessGame.id, chess);
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

    const getPlayerNameByGameAndColor = (id: number, color: 'White' | 'Black') => {
        const chess: Chess | undefined = chessGameChessObjects.get(id)
        return chess?.header()[color];
    }
</script>
<h1 class="my-[5vh]">Games</h1>

<div class="input-group input-group-divider grid-cols-[1fr_auto] max-w-[30rem] my-4">

    <input class="input" type="text" placeholder="Enter opponents username" bind:value={opponentUsername} />
    <button class="variant-filled-primary" on:click={createGame}>Start game</button>
</div>
<div class="mx-auto flex flex-wrap gap-8">
    {#each data.chessGames as chessGame}
        <a class="card card-hover w-full h-full max-w-[30rem] p-2" href="/games/{chessGame.id}">
            {#if mounted}
                <p class="font-bold">Game {chessGame.id}: {getPlayerNameByGameAndColor(chessGame.id, 'White')} VS {getPlayerNameByGameAndColor(chessGame.id, 'Black')}</p>
            {/if}
            <div class="pointer-events-none" id="board{chessGame.id}"></div>
        </a>
    {/each}
</div>