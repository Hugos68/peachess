<script lang="ts">
	import { Chess, SQUARES, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
    import '../../../chessground.css';
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";
	import { invalidateAll } from "$app/navigation";

    export let data: PageData;

    $: chessGame = data.chessGame;

    let chess: Chess;
    let chessBoard: any;
    let boardElement: HTMLElement;
    let promotionModal: HTMLElement;
    let mounted: boolean;
    onMount(() => {
        mounted = true;
        chessBoard = Chessground(boardElement as HTMLElement);
        loadGame(chessGame);
    });

    const loadGame = (chessGame: ChessGame) => {
        invalidateAll();
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

    let promotionMove: CustomMove | null = null;
    const moveCallback = async (orig: Square, dest: Square) => {

        const promotion = checkIfPromotion(orig, dest);

        if (promotion) {
            promotionMove = {
                from: orig,
                to: dest
            }
            return;
        }

        await doMove({
            from: orig as string,
            to: dest as string
        });
    }

    const doMove = async (move: CustomMove) => {
        try {
            chess.move(move);
        // Load last stable state in case of error
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

        // Load last stable state in case of error
        if (error) {
            console.error(error);
            loadGame(chessGame);
        }
    }

    const checkIfPromotion = (orig: Square, dest: Square): boolean => {
        const {type, color} = chess.get(orig);
        const rankNumber =  Number.parseInt(dest.charAt(1));

        if (type!=='p') return false;
        if (color==='w' && rankNumber!==8) return false;
        if (color==='b' && rankNumber!==1) return false;

        return true;
    }

    const promote = (promotion: 'q' | 'r' | 'n' | 'b') => {
        if (!promotionMove) return;
        doMove({
            from: promotionMove.from,
            to: promotionMove.to,
            promotion: promotion
        });
        promotionMove = null;
    }
    
    const cancelPromote = () => {
        promotionMove = null;
        loadGame(chessGame);
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

<svelte:window on:click={(event) => {
    if (!promotionModal.contains(event.target)) {
        cancelPromote();
    }
}} />



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
        <div class:opacity-50={promotionMove!==null} bind:this={boardElement}></div>

        <!-- PROMOTION-MODAL -->
        <div bind:this={promotionModal} class:hidden={promotionMove===null} class="absolute top-0 left-[50%] translate-x-[-50%] z-[999] card p-4 m-4 bg-surface-600-300-token flex flex-col gap-2">
            <div class="flex gap-2">
                <button class="btn variant-filled-secondary flex-1" on:click={() => promote('q')}>Q</button>
                <button class="btn variant-filled-secondary flex-1" on:click={() => promote('r')}>R</button>
            </div>
            <div class="flex gap-2">
                <button class="btn variant-filled-secondary flex-1" on:click={() => promote('n')}>K</button>
                <button class="btn variant-filled-secondary flex-1" on:click={() => promote('b')}>B</button>
            </div>
            <button class="btn variant-filled-secondary" on:click={cancelPromote}>Cancel</button>
        </div>
    </div>

    <!-- BOARD-RIGHT-PANEL -->
    {#if mounted}
        <div class="flex-1 flex flex-col p-4">
            
        </div>
    {/if}
</div>




