<script lang="ts">
	import { BLACK, PAWN, SQUARES, WHITE, type Chess, type Move, type Square } from "chess.js";
	import { Chessground } from "chessground";
	import { fly } from "svelte/transition";
	import { onMount } from "svelte";
    import { settings } from "$lib/stores";
    import { createEventDispatcher } from "svelte";
	import { page } from "$app/stores";

    export let chessStore: any;
    let board: any;
    let boardElement: HTMLElement;
    let promotionModal: HTMLElement;
    let promotionMove: CustomMove | null = null;

    onMount(() => {
        board = Chessground(boardElement);
        chessStore.subscribe(value => {
            board.set(getConfig(value));
        });
    })

    const dispatch = createEventDispatcher();

    const getConfig = (chess: Chess) => {
        const chessGame: ChessGame = chessStore.getChessGame();
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

        dispatch('move', {
            from,
            to
        });
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
        dispatch('move', {
            from: promotionMove.from,
            to: promotionMove.to,
            promotion: promotion
        });
        promotionMove = null;
    }
    
    const cancelPromotion = () => {
        promotionMove = null;
    }
</script>

<svelte:window 
    on:mousedown={(event) => {
        if (!promotionModal.contains(event.target) && promotionMove!==null) cancelPromotion();
    }}
 /> 

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
            <button class="btn w-full variant-glass-secondary h-[25%] promo-queen-{'white'}" on:click={async () => await doPromotion('q')}></button>
            <button class="btn w-full variant-glass-secondary h-[25%] promo-rook-{'white'}" on:click={async () => await doPromotion('r')}></button>
            <button class="btn w-full variant-glass-secondary h-[25%] promo-knight-{'white'}" on:click={async () => await doPromotion('n')}></button>
            <button class="btn w-full variant-glass-secondary h-[25%] promo-bischop-{'white'}" on:click={async () => await doPromotion('b')}></button>
        {/if}
    </div>
</div>