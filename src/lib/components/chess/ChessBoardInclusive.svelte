<script lang="ts">
	import { BLACK, WHITE } from "chess.js";
	import type { Writable } from "svelte/store";
	import ChessBoard from "./ChessBoard.svelte";
	import MaterialTracker from "./MaterialTracker.svelte";
	import MoveControls from "./MoveControls.svelte";

    export let chessStateStore: Writable<ChessState>;
</script>

<div class="flex flex-col gap-2">
    <header class="flex justify-between">
        {#if $chessStateStore.chess.isCheckmate()}
            <p class="p-2 my-auto rounded-token font-semibold text-center bg-secondary-700">Checkmate</p>
        {:else if $chessStateStore.chess.isStalemate()}
            <p class="p-2 my-auto rounded-token font-semibold text-center bg-secondary-700">Stalemate</p>
        {:else if $chessStateStore.chess.isDraw()}
            <p class="p-2 my-auto rounded-token font-semibold text-center bg-secondary-700">Draw</p>
        {:else}
            {@const turn = $chessStateStore.chess.turn()}
            <p
            class="my-auto p-2 rounded-token font-semibold text-center"
            class:text-white={turn===BLACK}
            class:text-black={turn===WHITE}
            class:bg-white={turn===WHITE} 
            class:bg-black={turn===BLACK}
            >{turn===WHITE ? 'White' : 'Black'}'s turn</p>
        {/if}

        <div class="flex flex-col items-end">
            {#if ($chessStateStore.playingColor ? $chessStateStore.playingColor==='w' : true)}
                <p class="font-bold capitalize">{$chessStateStore.chess.header()['Black']}</p>
                <MaterialTracker material={$chessStateStore.material} color={WHITE} />
            {:else}
                <p class="font-bold capitalize">{$chessStateStore.chess.header()['White']}</p>
                <MaterialTracker material={$chessStateStore.material} color={BLACK} />
            {/if}
        </div>

    </header>

    <div class="overflow-hidden card h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
        <ChessBoard config={$chessStateStore.boardConfig} on:move={(event) => {
            chessStateStore.move(event.detail.from, event.detail.to, event.detail?.promotion);
        }}/>
    </div>


    <footer class="flex justify-between items-end">

        <MoveControls {chessStateStore} />

        <div class="flex flex-col items-end">
            {#if ($chessStateStore.playingColor ? $chessStateStore.playingColor==='b' : false)}
                <p class="font-bold capitalize">{$chessStateStore.chess.header()['Black']}</p>
                <MaterialTracker material={$chessStateStore.material} color={WHITE} />
            {:else}
                <p class="font-bold capitalize">{$chessStateStore.chess.header()['White']}</p>
                <MaterialTracker material={$chessStateStore.material} color={BLACK} />
            {/if}
        </div>
    </footer>
</div>