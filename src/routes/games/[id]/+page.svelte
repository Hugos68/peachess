<script lang="ts">
	import { BLACK, Chess, PAWN, SQUARES, WHITE, type Move, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";
	import { clipboard, SlideToggle, Tab, TabGroup, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
	import { fly } from "svelte/transition";
    import { settings, createChessGameStore } from "$lib/stores";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";

    export let data: PageData;

    const chessStore = createChessGameStore();

    let tabSet: number = 0
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
            turnColor: getTurnColor(chess), 
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

    const getTurnColor = (chess: Chess) => {
        return (chess.turn() === WHITE) ? 'white' : 'black';
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
    
	function triggerCopiedToast(type: 'Link' | 'FEN' | 'PGN') {
        const t: ToastSettings = {
            message: 'Successfully copied: '+type,
            preset: 'success',
            autohide: true
        }
        toastStore.trigger(t);
	}

    onMount(() => {
        chessStore.loadGame(data.chessGame);
        chessBoard = Chessground(boardElement);
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

        <TabGroup regionPanel="flex-1 flex flex-col overflow-hidden" class="h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))] card !bg-secondary-700 p-4 flex flex-col">
            <Tab bind:group={tabSet} name="moves" value={0}>Moves</Tab>
            <Tab bind:group={tabSet} name="chat" value={1}>Chat</Tab>
            <Tab bind:group={tabSet} name="settings" value={2}>Settings</Tab>
            <Tab bind:group={tabSet} name="share" value={3}>Share</Tab>
    
            <svelte:fragment slot="panel">
                {#if tabSet === 0}
                    <div class="flex gap-2">
                        <span class="flex-1 p-1"><strong>No.</strong></span>
                        <span class="flex-1 p-1"><strong>White</strong></span>
                        <span class="flex-1 p-1"><strong>Black</strong></span>
                    </div>
                    {#key $chessStore}
                        <ul id="moveList" class="overflow-scroll flex-1">
                            {#each chessStore.getTotalMoveHistory() as move, i} 
                                {#if i%2===0}
                                    <li id="move{i}" class="w-full flex gap-2">
                                        <span class="flex-1 p-1">{i/2+1}</span>
                                        <span class="flex-1 p-1 rounded-token {chessStore.getCurrentMoveHistory().length-1===i ? "bg-primary-500/50" : ""}">{move.san}</span>
                                        <span class="flex-1 p-1 rounded-token {chessStore.getCurrentMoveHistory().length-1===i+1 ? "bg-primary-500/50" : ""}">
                                            {#if chessStore.getTotalMoveHistory()[i+1]}
                                                {chessStore.getTotalMoveHistory()[i+1].san}
                                            {/if}
                                        </span>
                                    </li>
                                {/if}
                            {/each}
                        </ul>
                    {/key}
                {:else if tabSet === 1}
                        <p>Coming soon</p>
                {:else if tabSet === 2}
                        <!-- ON ANY OF THESE INPUTS UPDATE THE SETTINGS (WE DO A TIMEOUT FOR THE LOCALSTORAGE TO UPDATE) -->
                        <div class="flex flex-col" on:input={() => setTimeout(() => {
    
                            // If premove got turned off, cancel current premove if present
                            if (!$settings.premove) chessBoard.cancelPremove();
                        }, 25)}>
                        <label class="flex items-center gap-2 justify-between" for="animate">
                            Animate
                            <SlideToggle class="variant-ghost-secondary" name="animate" bind:checked={$settings.animate}  />
                        </label>
                        <label class="flex items-center gap-2 justify-between" for="drag">
                            Drag
                            <SlideToggle name="drag" bind:checked={$settings.drag} />
                        </label>
                        <label class="flex items-center gap-2 justify-between" for="sfx">
                            Sound Effects
                            <SlideToggle name="sfx" bind:checked={$settings.sfx} />
                        </label>
                        <label class="flex items-center gap-2 justify-between" for="premove">
                            Premove
                            <SlideToggle name="premove" bind:checked={$settings.premove} />
                        </label>
                    </div>
                {:else if tabSet === 3}
                    <p class="text-xl font-bold text-center">Click to copy</p>
                    <div class="flex flex-col gap-8">
                        <label use:clipboard={$page.url} on:click={() => triggerCopiedToast('Link')}>
                            Link:
                            <input class="input" type="text" readonly value={$page.url} />
                        </label>
                        <label use:clipboard={$chessStore.fen()} on:click={() => triggerCopiedToast('FEN')}>
                            FEN:
                            <input class="input" type="text" readonly value={$chessStore.fen()} />
                        </label>
                        <label use:clipboard={$chessStore.pgn()} on:click={() => triggerCopiedToast('PGN')}>
                            PGN:
                            <textarea class="input resize-none" rows=10 readonly value={$chessStore.pgn()} />
                        </label>
                    </div>
                {/if}
            </svelte:fragment>
        </TabGroup>
 </div>