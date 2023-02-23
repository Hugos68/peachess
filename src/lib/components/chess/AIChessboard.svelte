<script lang="ts">
	import type { Writable } from "svelte/store";
	import ChessBoard from "./ChessBoard.svelte";
    import { aiMove } from 'js-chess-engine';
    export let chessStateStore: Writable<AIChessState>;
</script>

<ChessBoard bind:config={$chessStateStore.boardConfig} on:move={(event) => {
        chessStateStore.move(event.detail.from, event.detail.to, event.detail?.promotion);
}}/>