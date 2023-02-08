<script lang="ts">
	import { page } from "$app/stores";
    import ChessBoard from "$lib/components/ChessBoard.svelte";
    import { supabase } from "$lib/supabase";
	import { onDestroy } from "svelte";

    let chessGame: ChessGame;
    
    supabase
    .from("games")
    .select("*")
    .or(`player_id_white.eq.${$page.data.session.user.id},player_id_black.eq.${$page.data.session.user.id}`)
    .limit(1)
    .single()
    .then(({error, data}) => {
        chessGame = data;
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
        (payload) => chessGame = payload.new as ChessGame
    )
    .subscribe();

    onDestroy(() => {
        supabase.removeChannel(channel);
    });
</script>

<div class="mx-auto flex flex-col justify-center items-center gap-4">
    {#if chessGame}
        {#key chessGame}
            <ChessBoard chessGame={chessGame} />
        {/key}
    {/if}
</div>
