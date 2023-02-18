<script lang="ts">
	import { BLACK, WHITE, type Square } from "chess.js";
    import type { PageData } from "./$types";
	import { onDestroy } from "svelte";
	import { supabase } from "$lib/supabase";
    import { createChessGameStore } from "$lib/stores";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
	import ChessBoardSidePanel from "$lib/components/chess/ChessBoardSidePanel.svelte";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import { page } from "$app/stores";

    export let data: PageData;

    const chessStore = createChessGameStore();
    chessStore.loadGame(data.chessGame);

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
            
            chessStore.loadGame(updatedChessGame);
        }
    )
    .subscribe();

    const handleMove = async (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b') => {
        
        chessStore.move(from, to, promotion);

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
        if (error) chessStore.loadGame(data.chessGame);
    }

    const getPlayingSide = (chessGame: ChessGame) => {
        const playingColor = getPlayingColor(chessGame);
        
        // Default to white (for spectators)
        return playingColor || 'white';
    }

    const getPlayingColor = (chessGame: ChessGame) => {
        if (!$page.data.session) return undefined;
        return $page.data.session.user.id === chessGame.player_id_black ? 'black' : 'white';
    }
    
    onDestroy(() => {
        channel.unsubscribe();
    });
</script>

<svelte:window 
    on:keydown={(event) => {
        if (event.key==='ArrowLeft') chessStore.loadPreviousMove();
        if (event.key==='ArrowRight') chessStore.loadNextMove();
    }}
 /> 

 <div class="mt-[5vh] mx-auto flex flex-col xl:flex-row justify-center items-center gap-12">

    <div class="flex flex-col gap-4">
        <header class="flex justify-between">
            <div class="flex gap-2">
    
            {#if $chessStore.isGameOver()}
                <p  class="p-2 rounded-token font-semibold text-center bg-secondary-700">
                    {#if $chessStore.isCheckmate()}
                        {$chessStore.turn() === WHITE ? 'Black' : 'White'} won with checkmate
                    {:else if $chessStore.isStalemate()}
                        Stalemate
                    {:else if $chessStore.isDraw()}
                        Draw    
                    {/if}
                </p>
            {:else}
                <p
                class="p-2 rounded-token font-semibold text-center"
                class:text-white={$chessStore.turn()===BLACK}
                class:text-black={$chessStore.turn()===WHITE}
                class:bg-white={$chessStore.turn()===WHITE} 
                class:bg-black={$chessStore.turn()===BLACK}>
                {$chessStore.turn()===WHITE ? 'White' : 'Black'}'s turn
                </p>
            {/if}
       
            </div>
            <p class="font-bold !text-xl">
                {#if getPlayingSide(data.chessGame)==='white'}
                    {$chessStore.header().Black}
                {:else} 
                    {$chessStore.header().White}
                {/if}
            </p>
        </header>

        <div class="h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
            <ChessBoard playingSide={getPlayingSide(data.chessGame)} chessStore={chessStore}  on:move={(event) => {
                handleMove(
                    event.detail.from,
                    event.detail.to,
                    event.detail.promotion
                );
            }} />
        </div>


        <footer class="flex justify-between items-end">

            <MoveControls chessStore={chessStore} />
       
            <p class="font-bold !text-xl">
            {#if getPlayingSide(data.chessGame)==='black'}
                {$chessStore.header().Black}
            {:else} 
                {$chessStore.header().White}
            {/if}
            </p>
        </footer>
    </div>

    <div class="h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
        <ChessBoardSidePanel chessStore={chessStore} />
    </div>
 </div>