<script lang="ts">
	import { BLACK, WHITE, type Square } from "chess.js";
    import type { PageData } from "./$types";
	import { supabase } from "$lib/supabase";
    import { createChessStateStore, type ChessStateStore } from "$lib/stores";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
	import ChessBoardSidePanel from "$lib/components/chess/ChessBoardSidePanel.svelte";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import { page } from "$app/stores";
	import { onMount } from "svelte";
	import { derived, type Readable } from "svelte/store";
	import { getCapturedPieces, getMaterial } from "$lib/util";
	import { fly } from "svelte/transition";

    export let data: PageData;

    const chessStateStore: ChessStateStore = createChessStateStore(data.chessGame);

    const fullPieceNameObject = {
        k: 'king', q: 'queen', r: 'rook', n: 'knight', b: 'bishop', p: 'pawn'
    }

    const capturedPiecesWhite: Readable<CapturedPieces> = derived(chessStateStore, $chessStateStore => {
        return getCapturedPieces($chessStateStore.moveStack, WHITE);
    });
    
    const capturedPiecesBlack: Readable<CapturedPieces> = derived(chessStateStore, $chessStateStore => {
        return getCapturedPieces($chessStateStore.moveStack, BLACK);
    });


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

    const getPlayingSide = (chessGame: ChessGame): 'w' | 'b' => {
        const playingColor = getPlayingColor(chessGame);
        
        // Default to white (for spectators)
        return playingColor || 'w';
    }

    const getPlayingColor = (chessGame: ChessGame): 'w' | 'b' | undefined => {
        if (!$page.data.session) return;    
        if ($page.data.session.user.id === chessGame.player_id_white) return 'w';
        if ($page.data.session.user.id === chessGame.player_id_black) return 'b';
    }
</script>

<svelte:window 
    on:keydown={(event) => {
        if (event.key==='ArrowLeft' && $chessStateStore.moveStack.length!==0) chessStateStore.loadPreviousMove();
        if (event.key==='ArrowRight' && $chessStateStore.undoneMoveStack.length!==0) chessStateStore.loadNextMove();
    }}
 /> 

 <div class="mx-auto flex flex-col xl:flex-row justify-center items-center gap-12">

    <div class="flex flex-col gap-4">
        <header class="flex justify-between">
            <div class="flex gap-2">
            {#if $chessStateStore.chess.isGameOver()}
                <p class="p-2 my-auto rounded-token font-semibold text-center bg-secondary-700">
                    {#if $chessStateStore.chess.isCheckmate()}
                        Checkmate
                    {:else if $chessStateStore.chess.isStalemate()}
                        Stalemate
                    {:else if $chessStateStore.chess.isDraw()}
                        Draw    
                    {/if}
                </p>
            {:else}
                <p
                class="my-auto p-2 rounded-token font-semibold text-center"
                class:text-white={$chessStateStore.chess.turn()===BLACK}
                class:text-black={$chessStateStore.chess.turn()===WHITE}
                class:bg-white={$chessStateStore.chess.turn()===WHITE} 
                class:bg-black={$chessStateStore.chess.turn()===BLACK}>
                {$chessStateStore.chess.turn()===WHITE ? 'White' : 'Black'}'s turn
                </p>
            {/if}
            </div>
            <div class="flex flex-col items-end">
                <p class="font-bold">{$chessStateStore.chess.header()[getPlayingSide($chessStateStore.chessGame) === BLACK ? 'White' : 'Black']}</p>
                <div class="flex flex-row-reverse gap-6">
                    {#each Object.entries(getPlayingSide($chessStateStore.chessGame) === BLACK ? $capturedPiecesWhite: $capturedPiecesBlack).filter(item => item[1] > 0) as [piece, amount] (piece)}
                    <div class="relative">
                        {#each Array(amount) as _, i}
                            <div 
                            style="transform: translateX(-{i*25}%);" 
                            class="absolute top-0 right-0 w-6 bg-cover aspect-square {fullPieceNameObject[piece]} {getPlayingSide($chessStateStore.chessGame) === BLACK ? "black" : "white"}" 
                            transition:fly={{y: 20, duration: 200}}
                            ></div>
                        {/each}
                    </div>
                {/each}
                </div>
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
                <div class="flex flex-row-reverse gap-6">
                    {#each Object.entries(getPlayingSide($chessStateStore.chessGame) === WHITE ? $capturedPiecesWhite: $capturedPiecesBlack).filter(item => item[1] > 0) as [piece, amount] (piece)}
                        <div class="relative">
                            {#each Array(amount) as _, i}
                                <div 
                                style="transform: translateX(-{i*25}%);" 
                                class="absolute bottom-0 right-0 w-6 bg-cover aspect-square {fullPieceNameObject[piece]} {getPlayingSide($chessStateStore.chessGame) === WHITE ? "black" : "white"}" 
                                transition:fly={{y: -20, duration: 200}}
                                ></div>
                            {/each}
                        </div>
                    {/each}
                </div>
                <p class="font-bold">{$chessStateStore.chess.header()[getPlayingSide($chessStateStore.chessGame) === WHITE ? 'White' : 'Black']}</p>
            </div>
        </footer>
    </div>

    <div class="h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
        <ChessBoardSidePanel chessStateStore={chessStateStore} />
    </div>
 </div>