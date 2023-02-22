<script lang="ts">
	import Chessboard from "./Chessboard.svelte";

    export let chessStateStore: OnlineChessStateStore;
</script>

<Chessboard bind:config={$chessStateStore.boardConfig} on:move={(event) => {
        chessStateStore.move(event.detail.from, event.detail.to, event.detail?.promotion);
}}/>