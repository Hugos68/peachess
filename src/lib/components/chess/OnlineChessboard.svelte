<script lang="ts">
	import { page } from "$app/stores";
	import type { ChessStateStore } from "$lib/stores/chess-store";
	import { getLastMoveHighlight, getOrientation, getPlayingColor, getViewOnly, getValidMoves } from "$lib/util";
	import { WHITE } from "chess.js";
	import Chessboard from "./Chessboard.svelte";

    export let chessStateStore: ChessStateStore
    

    const getConfig = (chessState: ChessState) => {
        const {chessGame, chess, moveStack, undoneMoveStack} = chessState;
        return {
            fen: chess.fen(),
            turnColor: chess.turn() === WHITE ? 'white' : 'black',
            orientation: getOrientation(chessGame, $page.data.session),
            lastMove: getLastMoveHighlight(moveStack),
            viewOnly: getViewOnly(chessGame, chess, undoneMoveStack, $page.data.session),
            check: chess.inCheck(),
            movable: {
                color: getPlayingColor(chessGame, $page.data.session),
                free: false,
                dests: getValidMoves(chess),
                showDests: true,
            },
            drawable: {
                enabled: true,
                eraseOnClick: true
            },
    
        }
    }
    
    let config = getConfig($chessStateStore);

    chessStateStore.subscribe(chessState => {
        config = getConfig(chessState);
    });
</script>

<Chessboard bind:config={config} on:move={(event) => {
        chessStateStore.move(event.detail.from, event.detail.to, event.detail?.promotion);
}}/>