<script lang="ts">
	import { page } from "$app/stores";
	import { Chess } from "chess.js";
	import { Chessground } from "chessground";
	import { onMount } from "svelte";
	import type { PageData } from "../$types";

    export let data: PageData;

    let chess: Chess = new Chess();
    onMount(() => {
        data.chessGames.forEach(chessGame => {
            chess.loadPgn(chessGame.pgn);
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
{#if chess}
    <a class="flex flex-wrap">
        {#each data.chessGames as chessGame}
            <div class="w-[20rem] h-[20rem] aspect-square relative">
                <!-- BOARD -->
                <div id="board{chessGame.id}"></div>
            </div>
        {/each}
    </a>
{/if}