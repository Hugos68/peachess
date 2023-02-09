<script lang="ts">
    import { Chess, type Color} from 'chess.js'
	import { page } from "$app/stores";
    import ChessBoard from "$lib/components/ChessBoard.svelte";
    import { supabase } from "$lib/supabase";
	import { onDestroy } from "svelte";

    let chess: Chess;
    let chessRecord: ChessRecord;
    
    supabase
    .from("games")
    .select("*")
    .or(`player_id_white.eq.${$page.data.session.user.id},player_id_black.eq.${$page.data.session.user.id}`)
    .limit(1)
    .single()   
    .then(({error, data}) => {
        chessRecord = data;
        chess = new Chess(chessRecord.fen);
    }); 

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
