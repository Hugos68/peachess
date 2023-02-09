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
            chessRecord = payload.new as ChessRecord;
            chess = new Chess(chessRecord.fen);
        }
    )
    .subscribe();
    
    let playingColor: Color;
    $: if (chessRecord) playingColor = $page.data.session.user.id===chessRecord.player_id_white ? 'w' : 'b';
  
    let board;

    onDestroy(() => {
        supabase.removeChannel(channel);
    });
</script>

<div class="card mx-auto flex justify-center items-center gap-4">
    {#if chessRecord}
        {#key chessRecord}
            <ChessBoard chess={chess} flipped={playingColor==='b'} bind:this={board} />
        {/key}
    {/if}
</div>
