<script lang="ts">
	import type { Square } from "chess.js";
	import { Chessground } from "chessground";
	import { fly } from "svelte/transition";
	import { onMount } from "svelte";
	import { createEventDispatcher } from "svelte";
	import { focusTrap } from "@skeletonlabs/skeleton";
	import { settings } from "$lib/stores/settings-store";

    export let config: any;

    let board: any;
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

    // Apply new settings when settings change
    $: $settings, () => {
        config.animation = {
            enabled: $settings.animate,
            duration: $settings.animationDuration
        }
        config.premovable = {
            enabled: $settings.premove
        }
        config.draggable = {
            enabled: $settings.drag
        }
        config.highlight = {
            lastMove: $settings.lastMoveHighlight,
            check: $settings.checkHighlight
        }
        board.set(config);
    }


    $: $config,  if (board) {
        board.playPremove();
    }

    const dispatch = createEventDispatcher();

    const moveCallback = (from: Square, to: Square) => {        
        // If there is a promotion set the promotionMove and return so that the move doesn't get played yet (in case of a promotion cancel)
        const promotion = isMovePromotion(to);
        if (promotion) { 
            promotionMove = { from, to };
            return;
        }

        dispatch('move', {
            from,
            to
        });
    }

    const isMovePromotion = (to: Square): boolean => {
        const { role, color } = board.state.pieces.get(to);
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
        return config.orientation === 'White' ? percentage : 87.5-percentage;
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
<div class="relative h-full w-full aspect-square">

    <!-- BOARD -->
    <div class="transition-[filter] card h-full flex justify-center items-center" class:brightness-50={promotionMove!==null} bind:this={boardElement}>
        <p class="animate-bounce text-lg"><strong>Loading board...</strong></p>
    </div>

    <!-- PROMOTION-MODAL -->
    <div bind:this={promotionModal} class:hidden={promotionMove===null} class="absolute top-0 w-[12.5%] h-[50%] z-[50] bg-primary-500">
        {#if promotionMove}
            <div class="h-full w-full" transition:fly={{y: -100, duration: 200}} use:focusTrap={promotionMove!==null}>
                <button class="btn variant-filled-primary rounded-none hover:rounded-3xl transition-[border-radius] w-full h-[25%] bg-cover queen {config.orientation}" on:click={() => handlePromotion('q')}></button>
                <button class="btn variant-filled-primary rounded-none hover:rounded-3xl transition-[border-radius] w-full h-[25%] bg-cover rook {config.orientation}" on:click={() => handlePromotion('r')}></button>
                <button class="btn variant-filled-primary rounded-none hover:rounded-3xl transition-[border-radius] w-full h-[25%] bg-cover knight {config.orientation}" on:click={() => handlePromotion('n')}></button>
                <button class="btn variant-filled-primary rounded-none hover:rounded-3xl transition-[border-radius] w-full h-[25%] bg-cover bishop {config.orientation}" on:click={() => handlePromotion('b')}></button>
            </div>
        {/if}
    </div>
</div>