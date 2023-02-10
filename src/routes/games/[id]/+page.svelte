<script lang="ts">
    import { Chess, type Color} from 'chess.js'
	import { page } from "$app/stores";
    import ChessBoard from "$lib/components/ChessBoard.svelte";
    import { supabase } from "$lib/supabase";
	import { onDestroy, SvelteComponent } from "svelte";
    import type { PageData } from './$types';
	import { fade } from 'svelte/transition';

    export let data: PageData;
    
    let { chessRecord } = data;
    let chess: Chess = new Chess(chessRecord?.fen);

    const channel = supabase
    .channel('table-db-changes')
    .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
        },
        (payload) => {
            chessRecord = payload.new as ChessRecord;
            chess = new Chess(chessRecord.fen);

            if (chess.isGameOver()) {

            }
        }
    )
    .subscribe();
    
    let playingColor: Color | null;
    $: if (chessRecord && $page.data.session) {
        if ($page.data.session.user.id===chessRecord.player_id_white) playingColor = 'w';
        else if ($page.data.session.user.id===chessRecord.player_id_black) playingColor = 'b';
        else playingColor = null;
    }

    $: turnColor = chess.turn() === 'w' ? 'w' : 'b';

    let error: string;

    const move = async (move: string) => {     

        if (!playingColor) {
            promptError("You are not a participant in this game");
            return;
        }

        if (turnColor!==playingColor) {
            promptError("It's not your turn to move");
            return;
        }

        try {
            chess.move(move as string);
        } catch (error) {
            promptError(error.message);
            return;
        }

        // Reassign chess object to update board
        chess = chess;
        
        const {data, error} = await supabase.functions.invoke('move', {
            body : {
                gameId: chessRecord?.id,
                move: move
            }
        }); 
    }

    let errorTimer = setTimeout(() => error="", 3000);
    const promptError = (message: string) => {
        clearTimeout(errorTimer);
        error = message;
        errorTimer = setTimeout(() => error="", 3000);
    }

    let board: SvelteComponent;
    onDestroy(() => {
        supabase.removeChannel(channel);
    });
</script>

<div class="mx-auto flex flex-col lg:flex-row justify-between">
    <div class="flex-1 flex flex-col">
        <div class="card p-4 lg:p-8 flex justify-between items-center">
            <p class="font-bold !text-2xl">{turnColor==='w' ? "White" : "Black"}'s turn...</p>
            <button class="btn lg:btn-lg variant-filled-secondary " on:click={board.flip()}>Flip Board</button>
        </div>
        <div class="card bg-surface-300-600-token p-4 lg:p-8 flex-1 flex flex-col gap-8">
            <span class="font-bold !text-lg lg:!text-2xl">
                <p>Player 1, white {#if playingColor==='w'}(you){/if} :</p>
                {chessRecord?.player_id_white}
            </span>
            <span class="font-bold !text-lg lg:!text-2xl">
                <p>Player 2, black {#if playingColor==='b'}(you){/if} :</p>
                {chessRecord?.player_id_black}
            </span>
            <span class="h-5">
                {#if error}
                    <p class="font-bold !text-lg lg:!text-2xl text-red-600" out:fade>{error}</p>
                {/if}
            </span>
        </div>
    </div>

    <div class="w-[min(calc(100vh-var(--header-height)-2rem),100%)]">
        {#key chess}
            <ChessBoard chess={chess} flipped={playingColor==='b'} bind:this={board} on:move={(event) => move(event.detail.move) } />
        {/key}
    </div>
</div>