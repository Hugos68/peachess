<script lang="ts">
	import type { ChessStateStore } from "$lib/stores/chess-store";
	import { supabase } from "$lib/supabase";
	import type { Square } from "chess.js";
	import { onMount } from "svelte";
	import ChessBoard from "./ChessBoard.svelte";

    export let chessStateStore: ChessStateStore;
    
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

<ChessBoard chessStateStore={chessStateStore} on:move={(event) => {
    handleMove(
        event.detail.from,
        event.detail.to,
        event.detail.promotion
    );
}} />