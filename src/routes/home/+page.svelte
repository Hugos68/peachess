<script lang="ts">
	import { page } from "$app/stores";
	import { supabase } from "$lib/supabase";
	import { Chess } from "chess.js";
	import { Chessground } from "chessground";
	import { onMount } from "svelte";
	import type { PageData } from "../$types";

    export let data: PageData;

    
    onMount(() => {
        data.chessGames.forEach(chessGame => {
            const chess: Chess = new Chess(chessGame.fen)
            const board = document.getElementById(`board${chessGame.id}`) as HTMLElement;
            const config = getConfig(chess);
            const chessBoard =  Chessground(board, config);
        });
    });

    const getConfig = (chess: Chess) => {
        return {
            fen: chess.fen(),
            viewOnly: true
        } 
    }

</script>

<h2 class="mt-[7.5vh]">Welcome, {$page.data.session.user.email}</h2>
<hr class="my-4" />
<h2 >Your games:</h2>
<div>
    {#each data.chessGames as chessGame}

        <div class="w-[min(100%,calc(100vh-var(--header-height)))] aspect-square relative">
            <!-- BOARD -->
            <div id="board{chessGame.id}"></div>
        </div>
    {/each}
</div>