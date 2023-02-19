<script lang="ts">
	import { BLACK, PAWN, WHITE, type Square } from "chess.js";
	import { Chessground } from "chessground";
	import { fly } from "svelte/transition";
	import { onMount } from "svelte";
    import { settings, type ChessStateStore } from "$lib/stores";
    import { createEventDispatcher } from "svelte";
	import { page } from "$app/stores";
	import { focusTrap } from "@skeletonlabs/skeleton";
	import { getValidMoves as getValidDestinations } from "$lib/util";

    export let chessStateStore: ChessStateStore;

    let board: any;
    let boardElement: HTMLElement;
    let promotionModal: HTMLElement;
    let promotionMove: CustomMove | null = null;

    const dispatch = createEventDispatcher();

    onMount(() => {
        board = Chessground(boardElement);
    })

    $: if (board) {
        board.set(getConfig($chessStateStore));
    }
    $: if (board) {
        board.set({
            premovable: {
                enabled: $settings.premove
            },
            animation: {
                enabled: $settings.animate,
            },
            draggable: {
                enabled: $settings.drag
            },
        });
    }



    const getConfig = (chessState: ChessState) => {
        return {
            fen: chessState.chess.fen(),
            turnColor: (chessState.chess.turn() === WHITE) ? 'white' : 'black',
            orientation: getOrientation(chessState.chessGame),
            lastMove: getLastMoveHighlight(),
            viewOnly: getViewOnly(chessState),
            check: chessState.chess.inCheck(),
            highlight: {
                lastMove: true,  
            },
            movable: {
                color: getPlayingColor(chessState.chessGame),
                free: false,
                dests: getValidDestinations(chessState.chess),
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
        const move = $chessStateStore.moveStack[$chessStateStore.moveStack.length-1]; 
        if (!move) return [];
        return [move.from, move.to];
    }

    const getViewOnly = (chessState: ChessState) => {

        // If someone is not logged in they cannot make moves
        if (!$page.data.session) return true;

        // If someone is not part of the game they cannot make moves
        if ($page.data.session.user.id !== chessState.chessGame.player_id_white && $page.data.session.user.id !== chessState.chessGame.player_id_black) return true;

        // If someone is part of the game but they aren't looking at the latest turn they cannot make moves
        if (chessState.undoneMoveStack.length!==0) return true;

        // If the game is over they cannot make moves
        if ($chessStateStore.chess.isGameOver()) return true;
        return false;
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
        return getOrientation($chessStateStore.chessGame) === 'white' ? percentage : 87.5-percentage;
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

<svelte:window on:mousedown={(event) => {
        if (!promotionModal.contains(event.target) && promotionMove!==null) cancelPromotion();
}} /> 


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