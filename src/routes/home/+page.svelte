<script lang="ts">
	import { page } from "$app/stores";
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
            const chessGround =  Chessground(board, config);
        });
    });

    const getConfig = (chess: Chess) => {
        return {
            fen: chess.fen(),
            viewOnly: true
        } 
    }

</script>
<p class="mt-[7.5vh] text-center !leading-tight !text-[clamp(2rem,5vw,3rem)]">Welcome,</p>
<p class="text-center !leading-tight !text-[clamp(1rem,5vw,3rem)]">{$page.data.session.user.email}</p>
<hr />
<h2 class="mt-[2.5vh]">Your games:</h2>
<div>
    {#each data.chessGames as chessGame}
        <div id="board{chessGame.id}"></div>
    {/each}
</div>