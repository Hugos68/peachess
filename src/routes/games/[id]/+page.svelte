<script lang="ts">
	import { BLACK, Chess, PAWN, SQUARES, WHITE, type Move, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";
	import { fly } from "svelte/transition";
    import { settings, createChessGameStore } from "$lib/stores";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
	import ChessBoardSidePanel from "$lib/components/chess/ChessBoardSidePanel.svelte";

    export let data: PageData;

    const chessStore = createChessGameStore();

    let chessBoard: any;
    let boardElement: HTMLElement;
    let promotionModal: HTMLElement;
    let promotionMove: CustomMove | null = null;

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
        
    const getConfig = (chess: Chess, chessGame: ChessGame) => {
        return {
            fen: chess.fen(),
            orientation: getOrientation(chessGame),
            turnColor: (chess.turn() === WHITE) ? 'white' : 'black',
            lastMove: getLastMoveHighlight(),
            viewOnly: getViewOnly(chessGame),
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
                enabled: $settings.premove,
                castle: true
            },
            animation: {
                enabled: $settings.animate,
                duration: 100
            },
            draggable: {
                enabled: $settings.drag
            },
            drawable: {
                enabled: true,
                eraseOnClick: true
            },
            events: {
                move: moveCallback
            }
        }
    }

    const getOrientation = (chessGame: ChessGame) => {
        const playingColor = getPlayingColor(chessGame);
        
        // Default to white (for spectators)
        return playingColor || 'white';
    }

    const getPlayingColor = (chessGame: ChessGame) => {
        if (!$page.data.session) return undefined;
        return $page.data.session.user.id === chessGame.player_id_black ? 'black' : 'white';
    }

    const getLastMoveHighlight = () => {
        const move = getLastMove();
        if (!move) return [];
        return [move.from, move.to];
    }

    const getViewOnly = (chessGame: ChessGame) => {
        if (!$page.data.session) return true;
        if ($page.data.session.user.id !== chessGame.player_id_white && $page.data.session.user.id !== chessGame.player_id_black) return true;
        if ($chessStore.isGameOver()) return true;
        return false;
	}

    const getLastMove = (): Move | undefined => {
        return chessStore.getPreviousMove();
    }

    const getValidDestinations = (chess: Chess) => {
        const dests = new Map();
        SQUARES.forEach(s => {
            const ms = chess.moves({square: s, verbose: true});
            if (ms.length) dests.set(s, ms.map(m => m.to));
        });
        return dests;
    }

    const moveCallback = async (from: Square, to: Square) => {        

        // If there is a promotion set the promotionMove and return so that the move doesn't get played yet (in case of a promotion cancel)
        const promotion = isMovePromotion(from, to);
        if (promotion) { 
            promotionMove = { from, to };
            return;
        }
        doMove(from, to);
    }

    const doMove = async (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b') => {
        
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

    const isMovePromotion = (from: Square, to: Square): boolean => {
        const {type, color} = $chessStore.get(from);
        const rankNumber =  Number.parseInt(to.charAt(1));

        if (type!==PAWN) return false;
        if (color===WHITE && rankNumber!==8) return false;
        if (color===BLACK && rankNumber!==1) return false;

        // Set the modal offset the correct amount so that the modal appears in the right spot
        promotionModal.style.left = getPromotionModalOffsetPercentage(to) + "%";
        return true;
    }

    const getPromotionModalOffsetPercentage = (toSquare: Square)=> {
        const letter = toSquare.charAt(0) || 'a';
        const number = parseInt(letter, 36) - 9;
        const percentage = (number-1) * 12.5;

        // We check color here to deal with the board orientation
        return getOrientation(data.chessGame) === 'white' ? percentage : 87.5-percentage;
    }

    const doPromotion = async (promotion: 'q' | 'r' | 'n' | 'b') => {
        if (!promotionMove) return;
        doMove(promotionMove.from as Square, promotionMove.to as Square, promotion);
        promotionMove = null;
    }
    
    const cancelPromotion = () => {
        promotionMove = null;
    }

    onMount(() => {

        // Load the game
        chessStore.loadGame(data.chessGame);

        // Fill the chessboard element
        chessBoard = Chessground(boardElement);

        // On any chessStore change, update the board with a config derived from the updated store value
        chessStore.subscribe(value => {
            if (chessBoard) chessBoard.set(getConfig(value, data.chessGame));
        });        
    });
    
    onDestroy(() => {
        channel.unsubscribe();
    });
</script>

<svelte:window 
    on:mousedown={(event) => {
        if (!promotionModal.contains(event.target) && promotionMove!==null) cancelPromotion();
    }}
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
                {#if getOrientation(data.chessGame)==='white'}
                    {$chessStore.header().Black}
                {:else} 
                    {$chessStore.header().White}
                {/if}
            </p>
        </header>
        
        <!-- BOARD-WRAPPER -->
        <div class="relative h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
    
            <!-- BOARD -->
            <div class="flex justify-center items-center rounded-token w-full h-full" class:brightness-50={promotionMove!==null} bind:this={boardElement}>
                <p class="!text-[2rem] animate-bounce">
                    Loading board...
                </p>
            </div>
    
            <!-- PROMOTION-MODAL -->
            <div in:fly={{y: 50, duration: 150}} bind:this={promotionModal} class="absolute top-0 w-[12.5%] h-[50%] z-[50]">
                {#if promotionMove}
                    <button class="btn w-full variant-glass-secondary h-[25%] promo-queen-{getPlayingColor(data.chessGame) || 'white'}" on:click={async () => await doPromotion('q')}></button>
                    <button class="btn w-full variant-glass-secondary h-[25%] promo-rook-{getPlayingColor(data.chessGame) || 'white'}" on:click={async () => await doPromotion('r')}></button>
                    <button class="btn w-full variant-glass-secondary h-[25%] promo-knight-{getPlayingColor(data.chessGame) || 'white'}" on:click={async () => await doPromotion('n')}></button>
                    <button class="btn w-full variant-glass-secondary h-[25%] promo-bischop-{getPlayingColor(data.chessGame) || 'white'}" on:click={async () => await doPromotion(BLACK)}></button>
                {/if}
            </div>
    
        </div>
        <footer class="flex justify-between items-end">

            <MoveControls chessStore={chessStore} />
       
            <p class="font-bold !text-xl">
            {#if getOrientation(data.chessGame)==='black'}
                {$chessStore.header().Black}
            {:else} 
                {$chessStore.header().White}
            {/if}
            </p>
        </footer>
    </div>
    <ChessBoardSidePanel chessStore={chessStore} />
 </div>