<script lang="ts">
	import { Chess, SQUARES, type Color, type Move, type Piece, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
    import '../../../chessground.css';
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";

    export let data: PageData;

    let chessGame: ChessGame;
    let chess: Chess;
 
    let chessBoard: any;
    let mounted: boolean;
    onMount(() => {
        mounted = true;
        chessBoard = Chessground(document.getElementById("board") as HTMLElement);
        chessGame = data.chessGame;
        loadGame(chessGame);
    });

    const loadGame = (chessGame: ChessGame) => {
        chessGame = chessGame;
        chess = new Chess(chessGame.history[chessGame.history.length-1].fen);
        chessBoard.set(getConfig(chess, chessGame));
    }
    
    const getConfig = (chess: Chess, chessGame: ChessGame) => {
        return {
            fen: chess.fen(),
            orientation: getPlayingColor(chessGame),
            turnColor: getTurnColor(chess), 
            lastMove: getLastMove(chessGame),
            check: chess.inCheck(),
            highlight: {
                lastMove: true,  
            },
            movable: {
                color: getPlayingColor(chessGame),
                free: false,
                dests: getValidDestinations(chess)
            },
            premovable: {
                enabled: true,
                showDests: true
            },
            draggable: {
                showGhost: true
            },
            drawable: {
                enabled: true
            },
            events: {
                move: moveCallback
            }
        }
    }

    const getPlayingColor = (chessGame: ChessGame) => {
        if (!$page.data.session) return undefined;
        return $page.data.session.user.id === chessGame.player_id_white ? 'white' : 'black';
    }

    const getTurnColor = (chess: Chess) => {
        return (chess.turn() === 'w') ? 'white' : 'black';
    }

    const getLastMove = (chessGame: ChessGame) => {
        const from = chessGame.history[chessGame.history.length-1].move.from;
        const to = chessGame.history[chessGame.history.length-1].move.to
        if (!from || !to) return [];
        return [from, to];
    }

    const getValidDestinations = (chess: Chess) => {
        const dests = new Map();
        SQUARES.forEach(s => {
            const ms = chess.moves({square: s, verbose: true});
            if (ms.length) dests.set(s, ms.map(m => m.to));
        });
        return dests;
    }

    const moveCallback = async (orig: Square, dest: Square) => {
        const move = {
            from: orig,
            to: dest,
            promotion: getPromotion(orig, dest)
        }
        
        try {
            chess.move(move);
        } catch(error) {
            console.error(error);
            loadGame(chessGame);
            return;
        }
        
        
        const {data, error} = await supabase.functions.invoke('move', {
            body : {
                gameId: chessGame.id,
                move
            }
        });
        if (error) {
            loadGame(chessGame);
        }
    }

    let promotion: boolean = false;
    const getPromotion = (orig: Square, dest: Square): string | undefined => {
        const {type, color} = chess.get(orig);
        const rankNumber =  Number.parseInt(dest.charAt(1));

        if (type!=='p') return;
        if (color==='w' && rankNumber!==8) return;
        if (color==='b' && rankNumber!==1) return;

        promotion = true;
        
        return 'q';
    }

    const channel = supabase
    .channel('table-db-changes')
    .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
        },
        (payload) => {
            loadGame(payload.new as ChessGame);
            if (chess.isGameOver()) {
                // TODO: Game over
            }

            // If game is reloaded and still going on, play any remaining premoves
            chessBoard.playPremove();
        }
    )
    .subscribe();
    
    onDestroy(() => {
        channel.unsubscribe();
    });
</script>


<div class="mx-auto flex card bg-surface-500-400-token">

    <!-- BOARD-LEFT-PANEL -->
    {#if mounted}
        <div class="flex-1 flex flex-col p-4">
            <a href="/games">Back</a>
            <header class="flex p-4">    
    
                <p>{chess.turn()==='w' ? 'White' : 'black'} to move...</p>
            
            </header>
        </div>
    {/if}   
    
    <!-- BOARD-WRAPPER -->
    <div class="w-[min(100%,calc(100vh-var(--header-height)-4rem))] aspect-square relative">
        <!-- BOARD -->
        <div id="board"></div>

        <!-- PROMOTION-MODAL -->
        {#if promotion}
            <div class="absolute top-0 z-[999] card bg-surface-600-300-token w-32 h-32">HELLO WORLD</div>
        {/if}
    </div>

    <!-- BOARD-RIGHT-PANEL -->
    {#if mounted}
        <div class="flex-1 flex flex-col p-4">
            
        </div>
    {/if}
</div>




