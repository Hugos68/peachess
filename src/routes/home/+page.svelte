<script lang="ts">
	import { page } from "$app/stores";
    import ChessBoard from "$lib/components/ChessBoard.svelte";
    import { supabase } from "$lib/supabase";
    import { writable, type Writable } from "svelte/store";
	import { onMount } from "svelte";
    
    const chessGame: Writable<ChessGame> | Writable<null> = writable(null);

    onMount(() => {
        supabase
        .from("games")
        .select("*")
        .or(`player_id_white.eq.${$page.data.session.user.id},player_id_black.eq.${$page.data.session.user.id}`)
        .limit(1)
        .single()
        .then(({error, data}) => {
            chessGame.set(data)
        }); 

    });
</script>

<div class="mx-auto flex flex-col justify-center items-center gap-4">
    {#if $chessGame}
        <ChessBoard chessGame={$chessGame} />
    {:else}
        <p>No active game</p>
    {/if}
</div>
