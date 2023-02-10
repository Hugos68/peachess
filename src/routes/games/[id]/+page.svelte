<script lang="ts">
    import { Chess, type Color} from 'chess.js'
	import { page } from "$app/stores";
    import ChessBoard from "$lib/components/ChessBoard.svelte";
    import { supabase } from "$lib/supabase";
	import { onDestroy, SvelteComponent } from "svelte";
    import type { PageData } from './$types';

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

            // If the updated state is in sync with client don't update the board since it's already in the right state
            if (payload.new.fen===chess.fen()) return;
            chessRecord = payload.new as ChessRecord;
            chess = new Chess(chessRecord.fen);
        }
    )
    .subscribe();
    
    let playingColor: Color | null;
    let turnColor: Color;
    $: if (chessRecord) {
        if ($page.data.session.user.id===chessRecord.player_id_white) playingColor = 'w';
        else if ($page.data.session.user.id===chessRecord.player_id_black) playingColor = 'b';
        else playingColor = null;
        turnColor = chess.turn() === 'w' ? 'w' : 'b';
    }

    const move = async (move: string) => {       
        if (turnColor!==playingColor) return;

        chess.move(move as string);
        chess = new Chess(chess.fen());

        const {data, error} = await supabase.functions.invoke('move', {
            body : {
                gameId: chessRecord?.id,
                move: move
            }
        }); 
    }


    let board: SvelteComponent;
    onDestroy(() => {
        supabase.removeChannel(channel);
    });
</script>

<div class="mx-auto flex justify-between">
    <div class="flex-1 flex flex-col">
        <div class="card py-4 px-8 flex justify-between items-center">
            {#if turnColor === playingColor}
                <p class="font-bold !text-2xl">{turnColor==='w' ? "White" : "Black"}'s turn...</p>
            {:else}
                <p class="font-bold !text-2xl">Your turn...</p>
            {/if}

            <button class="btn variant-filled-secondary " on:click={board.flip()}>Flip Board</button>
        </div>
        <div class="card bg-surface-300-600-token p-8 flex-1 flex flex-col gap-8">
            <span class="font-bold !text-2xl">
                <p>Player 1, white {#if playingColor==='w'}(you){/if} :</p>
                {chessRecord?.player_id_white}
            </span>
            <span class="font-bold !text-2xl">
                <p>Player 2, black {#if playingColor==='b'}(you){/if} :</p>
                {chessRecord?.player_id_black}
            </span>
        </div>
    </div>

    <div class="w-[calc(100vh-var(--header-height)-2rem)]">
        {#key chess}
            <ChessBoard chess={chess} flipped={playingColor==='b'} bind:this={board} on:move={(event) => move(event.detail.move) } />
        {/key}
    </div>


</div>