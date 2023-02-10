<script lang="ts">
    import { Chess, type Color} from 'chess.js'
	import { page } from "$app/stores";
    import ChessBoard from "$lib/components/ChessBoard.svelte";
    import { supabase } from "$lib/supabase";
	import { onDestroy } from "svelte";
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
    
    let board;

    const move = async (move: string) => {
        const {data, error} = await supabase.functions.invoke('move', {
            body : {
                gameId: chessRecord?.id,
                move: move
            }
        }); 
    }

    onDestroy(() => {
        supabase.removeChannel(channel);
    });
</script>

<div class="card p-4 mx-auto flex justify-center items-center gap-4">
    <div class="w-[30%] flex flex-col">
        Current turn: {chess.turn() === 'w' ? "White" : "Black"}
    </div>
    <div class="w-[40%]">
        <p class="font-bold text-center p-4">
            {#if playingColor==='b'}
                Player white: {chessRecord?.player_id_white}
            {:else}
                Player black: {chessRecord?.player_id_black}
            {/if}
        </p>
        {#key chessRecord}
            <ChessBoard chess={chess} flipped={playingColor==='b'} bind:this={board} on:move={(event) => move(event.detail.move) } />
        {/key}
        <p class="font-bold text-center p-4">
            {#if playingColor==='w'}
                Player white: You
            {:else if playingColor==='b'}
                Player black: You
            {:else}
                Player white: {chessRecord?.player_id_white}
            {/if}
        </p>    </div>
    <div class="w-[30%]">

    </div>
</div>
