<script lang="ts">
	import type { Writable } from "svelte/store";
	import ChessBoard from "./ChessBoard.svelte";

    export let chessStateStore: Writable<OnlineChessState>;
</script>

<ChessBoard bind:config={$chessStateStore.boardConfig} on:move={(event) => {
        chessStateStore.move(event.detail.from, event.detail.to, event.detail?.promotion);
}}/>