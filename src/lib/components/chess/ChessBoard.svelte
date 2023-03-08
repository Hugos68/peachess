<script lang="ts">
	import type { Square } from "chess.js";
	import { Chessground } from "chessground";
	import { onMount } from "svelte";
	import { createEventDispatcher } from "svelte";
	import { focusTrap } from "@skeletonlabs/skeleton";
	import { settings } from "$lib/stores/settings-store";
    import type { Api } from 'chessground/api'
    import type { Config } from "chessground/config";
	import type { Key, Piece } from "chessground/types";

    export let config: Config;
    
    let board: Api;
    let boardElement: HTMLElement;  
    let promotionModal: HTMLElement;
    let promotionMove: CustomMove | null = null;

    onMount(() => {
        board = Chessground(boardElement, config);
        board.set({
            events: {
                move: moveCallback
            }
        });
    });

    // Apply new settings when settings are changed
    $: if (board) {
        const settingsConfig = {
            animation: {
                enabled: $settings.animate
            },
            draggable: {
                enabled: $settings.drag
            },
            highlight: {
                lastMove: $settings.lastMoveHighlight,
                check: $settings.checkHighlight
            },
            premovable: {
                enabled: $settings.premove
            }
        }
        board.set(settingsConfig);
    }

    let latestKnownFen: string | undefined = config.fen;
    $: if (board) {
        if (!config.fen || !config.orientation || !latestKnownFen) throw new Error("Latest known fen, fen or orientation are not defined");
        board.set(config);
        if (hasOpponentPlayed(latestKnownFen, config.fen || "", config.orientation)) board.playPremove();
        else board.cancelPremove();
        latestKnownFen = config.fen;
    }

    // This method checks if the playingColor is not the one who played the last move
    function hasOpponentPlayed(fenBefore: string, fenAfter: string, playingColor: 'white' | 'black'): boolean {
        const moveNumberBefore: number = getMoveNumber(fenBefore);
        const moveNumberAfter: number = getMoveNumber(fenAfter);
        if (playingColor === 'white' && moveNumberBefore === moveNumberAfter)  return false;
        if (playingColor === 'black' && moveNumberBefore > moveNumberAfter) return false;
        return true;
    }

    function getMoveNumber(fen: string): number {
        return Number.parseInt(fen.slice(fen.lastIndexOf(' ')));
    }

    const dispatch = createEventDispatcher();

    const moveCallback = (orig: Key, dest: Key, capturedPiece?: Piece | undefined) => {      

        // If there is a promotion set the promotionMove and return so that the move doesn't get played yet (in case of a promotion cancel)
        const promotion = isMovePromotion(dest as Square);
        if (promotion) { 
            promotionMove = { from: orig, to: dest };
            return;
        }

        dispatch('move', {
            from: orig,
            to: dest
        });
    }

    const isMovePromotion = (to: Square): boolean => {
        const piece: Piece | undefined = board.state.pieces.get(to);
        if (!piece) return false;
        const {role, color} = piece;
        const rankNumber =  Number.parseInt(to.charAt(1));

        if (role!=='pawn') return false;
        if (color==='white' && rankNumber!==8) return false;
        if (color==='black' && rankNumber!==1) return false;

        // Set the modal offset the correct amount so that the modal appears in the right spot
        promotionModal.style.left = getPromotionModalOffsetPercentage(to) + "%";
        return true;
    }

    const getPromotionModalOffsetPercentage = (toSquare: Square)=> {
        const letter = toSquare.charAt(0) || 'a';
        const number = parseInt(letter, 36) - 9;
        const percentage = (number-1) * 12.5;

        // We check color here to deal with the board orientation
        return config.orientation === 'white' ? percentage : 87.5-percentage;
    }

    const handlePromotion = (promotion: 'q' | 'r' | 'n' | 'b') => {
        if (!promotionMove) return;
        
        dispatch('move', {
            from: promotionMove.from,
            to: promotionMove.to,
            promotion
        });
        promotionMove = null;
    }
    
    const cancelPromotion = () => {
        promotionMove = null;
        board.set(config);
    }

	const handleWindowMouseDown = (event: MouseEvent & { currentTarget: EventTarget & Window; }): void => {
        if (!promotionModal.contains(event.target as HTMLElement) && promotionMove!==null) cancelPromotion();
	}
</script>

<svelte:window on:mousedown={handleWindowMouseDown} />

<!-- BOARD-WRAPPER -->
<div class="rounded-token overflow-hidden">

    <!-- BOARD -->
    <div class="transition-[filter] flex justify-center items-center" class:brightness-50={promotionMove!==null} bind:this={boardElement}>
        <p class="animate-bounce text-lg"><strong>Loading board...</strong></p>
    </div>

    <!-- PROMOTION-MODAL -->
    <div bind:this={promotionModal} class:hidden={promotionMove===null} use:focusTrap={promotionMove!==null} class="absolute top-0 w-[12.5%] h-[50%] z-[50]">
        <button class="btn variant-filled-surface w-full h-[25%] bg-cover queen {config.orientation}" on:click={() => handlePromotion('q')}></button>
        <button class="btn variant-filled-surface w-full h-[25%] bg-cover rook {config.orientation}" on:click={() => handlePromotion('r')}></button>
        <button class="btn variant-filled-surface w-full h-[25%] bg-cover knight {config.orientation}" on:click={() => handlePromotion('n')}></button>
        <button class="btn variant-filled-surface w-full h-[25%] bg-cover bishop {config.orientation}" on:click={() => handlePromotion('b')}></button>
    </div>
</div>