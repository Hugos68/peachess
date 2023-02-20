<script lang="ts">
	import { BLACK, WHITE, type Square } from "chess.js";
    import type { PageData } from "./$types";
	import { supabase } from "$lib/supabase";
    import { createChessStateStore, type ChessStateStore } from "$lib/stores/chess-store";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
    import MaterialTracker from "$lib/components/chess/MaterialTracker.svelte";
	import ChessBoardSidePanel from "$lib/components/chess/ChessBoardSidePanel.svelte";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import { onMount } from "svelte";
	import { getOrientation } from "$lib/util";
	import { page } from "$app/stores";

    export let data: PageData;

    const chessStateStore: ChessStateStore = createChessStateStore(data.chessGame);

    onMount(() => {

        // Only open a channel when the game is ongoing 
        if (!$chessStateStore.chess.isGameOver()) {
            const channel = supabase
            .channel('table-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'games',
                },
                // This callback is called whenever this game gets an update, payload contains the old and new version
                (payload) => {
                    const updatedChessGame: ChessGame = payload.new as ChessGame
                    
                    chessStateStore.loadGame(updatedChessGame);
                }
            )
            .subscribe();
            return () => channel.unsubscribe();
        }
    });


    const handleMove = async (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b') => {
        
        chessStateStore.move(from, to, promotion);

        // Execute the move to the database
        const {error} = await supabase.functions.invoke('move', {
            body : {
                gameId: data.chessGame.id,
                move: {
                    from, 
                    to,
                    promotion
                }
            }
        });

        // Reload to last known stable state if anything goes wrong
        if (error) chessStateStore.loadGame(data.chessGame);
    }
</script>

<svelte:window 
    on:keydown={(event) => {
        if (event.key==='ArrowLeft' && $chessStateStore.moveStack.length!==0) chessStateStore.loadPreviousMove();
        if (event.key==='ArrowRight' && $chessStateStore.undoneMoveStack.length!==0) chessStateStore.loadNextMove();
    }}
 /> 

 <div class="mx-auto flex flex-col xl:flex-row justify-center items-center gap-12">

    <div class="flex flex-col gap-2">
        <header class="flex justify-between">
            {#if $chessStateStore.chess.isCheckmate()}
                <p class="p-2 my-auto rounded-token font-semibold text-center bg-secondary-700">Checkmate</p>
            {:else if $chessStateStore.chess.isStalemate()}
                <p class="p-2 my-auto rounded-token font-semibold text-center bg-secondary-700">Stalemate</p>
            {:else if $chessStateStore.chess.isDraw()}
                <p class="p-2 my-auto rounded-token font-semibold text-center bg-secondary-700">Draw</p>
            {:else}
                <p
                class="my-auto p-2 rounded-token font-semibold text-center"
                class:text-white={$chessStateStore.chess.turn()===BLACK}
                class:text-black={$chessStateStore.chess.turn()===WHITE}
                class:bg-white={$chessStateStore.chess.turn()===WHITE} 
                class:bg-black={$chessStateStore.chess.turn()===BLACK}
                >{$chessStateStore.chess.turn()===WHITE ? 'White' : 'Black'}'s turn</p>
            {/if}

            <div class="flex flex-col items-end">
                {#if getOrientation($chessStateStore.chessGame, $page.data.session) === 'white'}
                    <p class="font-bold">{$chessStateStore.chess.header()['Black']}</p>
                    <MaterialTracker chessStateStore={chessStateStore} color={WHITE} />
                {:else}
                    <p class="font-bold">{$chessStateStore.chess.header()['White']}</p>
                    <MaterialTracker chessStateStore={chessStateStore} color={BLACK} />
                {/if}
            </div>

        </header>

        <div class="overflow-hidden card h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
            <ChessBoard chessStateStore={chessStateStore}  on:move={(event) => {
                handleMove(
                    event.detail.from,
                    event.detail.to,
                    event.detail.promotion
                );
            }} />
        </div>


        <footer class="flex justify-between items-end">

            <MoveControls chessStateStore={chessStateStore} />

            <div class="flex flex-col items-end">
                {#if getOrientation($chessStateStore.chessGame, $page.data.session) === 'black'}
                    <p class="font-bold">{$chessStateStore.chess.header()['Black']}</p>
                    <MaterialTracker chessStateStore={chessStateStore} color={WHITE} />
                {:else}
                    <p class="font-bold">{$chessStateStore.chess.header()['White']}</p>
                    <MaterialTracker chessStateStore={chessStateStore} color={BLACK} />
                {/if}
            </div>
        </footer>
    </div>

    <div class="h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
        <ChessBoardSidePanel chessStateStore={chessStateStore} />
    </div>
 </div>