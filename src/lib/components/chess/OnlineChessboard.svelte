<script lang="ts">
	import { page } from "$app/stores";
	import { getLastMoveHighlight, getOrientation, getPlayingColor, getViewOnly, getValidMoves } from "$lib/util";
	import { WHITE } from "chess.js";
	import Chessboard from "./Chessboard.svelte";

    export let chessStateStore: OnlineChessStateStore;
    
    
</script>

<Chessboard bind:config={$chessStateStore.boardConfig} on:move={(event) => {
        chessStateStore.move(event.detail.from, event.detail.to, event.detail?.promotion);
}}/>