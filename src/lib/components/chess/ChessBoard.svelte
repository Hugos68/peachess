<script lang="ts">
	import { BLACK, PAWN, WHITE, type Square } from "chess.js";
	import { Chessground } from "chessground";
	import { fly } from "svelte/transition";
	import { onMount } from "svelte";
    import type { ChessStateStore } from "$lib/stores/chess-store";
    import { settings } from "$lib/stores/settings-store";
    import { createEventDispatcher } from "svelte";
	import { focusTrap } from "@skeletonlabs/skeleton";
	import { getLastMoveHighlight, getOrientation, getPlayingColor, getValidMoves as getValidDestinations, getViewOnly } from "$lib/util";
	import { page } from "$app/stores";

    export let chessStateStore: ChessStateStore;

    let board: any;
    let boardElement: HTMLElement;
    let promotionModal: HTMLElement;
    let promotionMove: CustomMove | null = null;

    const dispatch = createEventDispatcher();

    onMount(() => {
        board = Chessground(boardElement);
    });

    $: if (board) {
        const movesAmountBefore = $chessStateStore.moveStack.length + $chessStateStore.undoneMoveStack.length;
        board.set(getConfig($chessStateStore));
        const movesAmountAfter = $chessStateStore.moveStack.length + $chessStateStore.undoneMoveStack.length;
        if (movesAmountAfter > movesAmountBefore) board.playPremove();
    }
    $: if (board) {
        board.set({
            premovable: {
                enabled: $settings.premove
            },
            animation: {
                enabled: $settings.animate,
                duration: $settings.animationDuration
            },
            draggable: {
                enabled: $settings.drag
            },
            highlight: {
                lastMove: $settings.lastMoveHighlight,
                check: $settings.checkHighlight
            }
        });
    }

    const getConfig = (chessState: ChessState) => {
        const {chessGame, chess, moveStack, undoneMoveStack} = chessState;
        return {
            fen: chess.fen(),
            turnColor: chess.turn() === WHITE ? 'white' : 'black',
            orientation: getOrientation(chessGame, $page.data.session),
            lastMove: getLastMoveHighlight(moveStack),
            viewOnly: getViewOnly(chessGame, chess, undoneMoveStack, $page.data.session),
            check: chess.inCheck(),
            movable: {
                color: getPlayingColor(chessGame, $page.data.session),
                free: false,
                dests: getValidDestinations(chess),
                showDests: true
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

    const moveCallback = (from: Square, to: Square) => {        
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

    const isMovePromotion = (from: Square, to: Square,): boolean => {
        const {type, color} = $chessStateStore.chess.get(from);
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
        return getOrientation($chessStateStore.chessGame, $page.data.session) === 'white' ? percentage : 87.5-percentage;
    }

    const handlePromotion = (promotion: 'q' | 'r' | 'n' | 'b') => {
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
        chessStateStore.loadGame($chessStateStore.chessGame);
    }
</script>

<svelte:window 
    on:mousedown={(event) => {
            if (!promotionModal.contains(event.target) && promotionMove!==null) cancelPromotion();
    }} 
    on:keydown={(event) => {
        if (event.key==='ArrowLeft' && $chessStateStore.moveStack.length!==0) chessStateStore.loadPreviousMove();
        if (event.key==='ArrowRight' && $chessStateStore.undoneMoveStack.length!==0) chessStateStore.loadNextMove();
    }}
/>

<!-- BOARD-WRAPPER -->
<div class="relative h-full w-full aspect-square">

    <!-- BOARD -->
    <div class="flex justify-center items-center w-full h-full transition-[filter]" class:brightness-50={promotionMove!==null} bind:this={boardElement}>
        <p class="!text-[2rem] animate-bounce">
            Loading board...
        </p>
    </div>

    <!-- PROMOTION-MODAL -->
    <div bind:this={promotionModal} class:hidden={promotionMove===null} class="absolute top-0 w-[12.5%] h-[50%] z-[50] bg-primary-500">
        {#if promotionMove}
            <div class="h-full w-full" transition:fly={{y: -100, duration: 200}} use:focusTrap={promotionMove!==null}>
                <button class="btn variant-filled-primary rounded-none hover:rounded-3xl transition-[border-radius] w-full h-[25%] bg-cover queen {getOrientation($chessStateStore.chessGame)}" on:click={() => handlePromotion('q')}></button>
                <button class="btn variant-filled-primary rounded-none hover:rounded-3xl transition-[border-radius] w-full h-[25%] bg-cover rook {getOrientation($chessStateStore.chessGame)}" on:click={() => handlePromotion('r')}></button>
                <button class="btn variant-filled-primary rounded-none hover:rounded-3xl transition-[border-radius] w-full h-[25%] bg-cover knight {getOrientation($chessStateStore.chessGame)}" on:click={() => handlePromotion('n')}></button>
                <button class="btn variant-filled-primary rounded-none hover:rounded-3xl transition-[border-radius] w-full h-[25%] bg-cover bishop {getOrientation($chessStateStore.chessGame)}" on:click={() => handlePromotion('b')}></button>
            </div>
        {/if}
    </div>
</div>