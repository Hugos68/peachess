<script lang="ts">
	import { BLACK, WHITE } from "chess.js";
    import type { PageData } from "./$types";
    import { createOnlineChessStateStore } from "$lib/stores/chess-store";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
    import MaterialTracker from "$lib/components/chess/MaterialTracker.svelte";
	import ChessBoardSidePanel from "$lib/components/chess/ChessInfoPanel.svelte";
	import { getPlayingColor } from "$lib/util";
	import { page } from "$app/stores";
	import { supabase } from "$lib/supabase";
	import OnlineChessBoard from "$lib/components/chess/OnlineChessboard.svelte";
	import type { Writable } from "svelte/store";

    export let data: PageData;

    const chessStateStore: Writable<OnlineChessState> = createOnlineChessStateStore(data.chessGame, getPlayingColor(data.chessGame, $page.data.session), supabase);
</script>

 <div class="mx-auto xl:h-[calc(100vh-2rem)] flex flex-col xl:flex-row justify-center items-center gap-12">

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
                    <p class="font-bold">{$chessStateStore.chess.header()['Black']}</p>
                    <MaterialTracker material={$chessStateStore.material} color={WHITE} />
                {:else}
                    <p class="font-bold">{$chessStateStore.chess.header()['White']}</p>
                    <MaterialTracker material={$chessStateStore.material} color={BLACK} />
                {/if}
            </div>

        </header>

        <div class="overflow-hidden card h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
            <OnlineChessBoard chessStateStore={chessStateStore} />
        </div>


        <footer class="flex justify-between items-end">

            <MoveControls chessStateStore={chessStateStore} />

            <div class="flex flex-col items-end">
                {#if ($chessStateStore.playingColor ? $chessStateStore.playingColor==='b' : false)}
                    <p class="font-bold">{$chessStateStore.chess.header()['Black']}</p>
                    <MaterialTracker material={$chessStateStore.material} color={WHITE} />
                {:else}
                    <p class="font-bold">{$chessStateStore.chess.header()['White']}</p>
                    <MaterialTracker material={$chessStateStore.material} color={BLACK} />
                {/if}
            </div>
        </footer>
    </div>

    <div class="h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
        <ChessBoardSidePanel chessStateStore={chessStateStore} />
    </div>
 </div>