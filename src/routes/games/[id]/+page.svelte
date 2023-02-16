<script lang="ts">
	import { BLACK, Chess, PAWN, SQUARES, WHITE, type Move, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";
	import { clipboard, localStorageStore, SlideToggle, Tab, TabGroup, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
    import type { Writable } from 'svelte/store';
    import { Howl } from 'howler';
	import { fly } from "svelte/transition";

    export let data: PageData;

    $: chessGame = data.chessGame;
    $: chess = new Chess();
    $: moveStack = chess.history({verbose: true}) as Move[];
    $: undoneMoveStack = [] as Move[];

    let tabSet: number = 0;
    let promotionMove: CustomMove | null = null;

    let chessBoard: any;

    const settings: Writable<Settings> = localStorageStore('settings',  {
        animate: true,
        sfx: true,
        premove: false,
        drag: true
    });

    let boardElement: HTMLElement;
    let promotionModal: HTMLElement;
    const moveSFX = new Howl({
        src: '/sfx/move.mp3'
    });
    const captureSFX = new Howl({
        src: '/sfx/capture.mp3'
    });
    const castleSFX = new Howl({
        src: '/sfx/castle.mp3'
    });
    const checkSFX = new Howl({
        src: '/sfx/check.mp3'
    });
    const gameOverSFX = new Howl({
        src: '/sfx/gameover.mp3'
    });

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

            loadGame(updatedChessGame);
        }
    )
    .subscribe();
        
    const loadGame = (newChessGame: ChessGame) => {

        // Check if the pgn is different, if they aren't it means we've done this move (by playing it ourselves) and dont need the move sound effect
        if (newChessGame.pgn!==chess.pgn()) {
            const move = getLastMove();
            if (move) playMoveSound(move);
        } 
        chessGame = newChessGame;

        chess.loadPgn(chessGame.pgn);
        
        updateUI();
    
        // Once game is reloaded play any premoves the player might have
        chessBoard.playPremove();
    } 

    const updateUI = () => {
        chessGame = chessGame;
        chess = chess;
        moveStack = moveStack;
        undoneMoveStack = undoneMoveStack;
        chessBoard.set(getConfig(chess, chessGame));
        scrollSelectedMoveIntoView();
    }
    
    const getConfig = (chess: Chess, chessGame: ChessGame) => {
        return {
            fen: chess.fen(),
            orientation: getOrientation(chessGame),
            turnColor: getTurnColor(chess), 
            lastMove: getLastMoveHighlight(),
            viewOnly: getViewOnly(),
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

    const getViewOnly = () => {
		if (undoneMoveStack.length!==0) return true;
        const session = $page.data.session;
        if (!session) return true;
        if (session.user.id !== chessGame.player_id_white && session.user.id !== chessGame.player_id_black) return true;
        return false;
	}

    const getLastMove = (): Move | undefined => {
        return undoneMoveStack[undoneMoveStack.length-1];
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
        
        try {
            // Move (throws exception if move is invalid)
            const move = chess.move({from, to, promotion});
            playMoveSound(move);
            
            updateUI();
        } catch(error) {
            console.error(error);
            return;
        }
        
        // Execute the move to the database
        const {error, data} = await supabase.functions.invoke('move', {
            body : {
                gameId: chessGame.id,
                move: {
                    from, 
                    to,
                    promotion
                }
            }
        });

        // Reload to last known stable state if anything goes wrong
        if (error) loadGame(chessGame);
    }

    const isMovePromotion = (from: Square, to: Square): boolean => {
        const {type, color} = chess.get(from);
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
        return getOrientation(chessGame) === 'white' ? percentage : 87.5-percentage;
    }

    const doPromotion = async (promotion: 'q' | 'r' | 'n' | 'b') => {
        if (!promotionMove) return;
        doMove(promotionMove.from as Square, promotionMove.to as Square, promotion);
        promotionMove = null;
    }
    
    const cancelPromotion = () => {
        promotionMove = null;
        updateUI();
    }

    const loadFirstMove = () => {
        let move;
        while (move = chess.undo()) undoneMoveStack.push(move);
        updateUI();
    }

    const loadPreviousMove =() => {
        const move = chess.undo();
        if (!move) return;
        undoneMoveStack.push(move);
        updateUI();
    }

    const loadNextMove = () => {
        const move = undoneMoveStack.pop();
        if (!move) return;
        playMoveSound(chess.move(move));
        updateUI();
    }
    
    const loadLastMove = () => {
        let move;
        while (move = undoneMoveStack.pop()) chess.move(move);
        updateUI();
    }

    const scrollSelectedMoveIntoView = () => {

        // Doing setTimeout without any time fixes the race condition between the elements loading and setting the scroll position
        setTimeout(() => {
            const li = document.getElementById('move'+(moveStack.length-1));
            if (li) li.scrollIntoView({behavior: 'smooth', block: "center"});
        });
    }

    const playMoveSound = (move: Move) => {
        if (!$settings.sfx) return;

        // '+' is when a piece checks the opponents king
        else if (move.san.includes('+')) checkSFX.play();

        // 'k' is when castling kingside, 'q' is when castling queenside
        else if (move.flags.includes('k') || move.flags.includes('q')) castleSFX.play();

        // 'c' is when a piece captures
        else if (move.flags.includes('c')) captureSFX.play();

        // 'n' is when a piece moves, 'b' is when a pawn moves 2 squares
        else if (move.flags.includes('n') || move.flags.includes('b')) moveSFX.play();

        // '#' is when a piece checkmates the opponents king
        if (move.san.includes('#')) gameOverSFX.play();
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
        chessBoard = Chessground(boardElement);
        loadGame(data.chessGame);
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
        if (event.key==='ArrowLeft') loadPreviousMove();
        if (event.key==='ArrowRight') loadNextMove();
    }} 
 /> 

 <div class="mt-[5vh] mx-auto flex flex-col xl:flex-row justify-center items-center gap-12">

    <div class="flex flex-col gap-4">
        <header class="flex justify-between">
            <div class="flex gap-2">
                {#if chess}
                    {#if chess.isGameOver()}
                        <p  class="p-2 rounded-token font-semibold text-center bg-secondary-700">
                        {#if chess.isCheckmate()}
                            {chess.turn() === WHITE ? 'Black' : 'White'} won with checkmate
                        {:else if chess.isStalemate()}
                            Stalemate
                        {:else if chess.isDraw()}
                            Draw    
                        {/if}
                        </p>
                    {:else}
                        <p
                        class="p-2 rounded-token font-semibold text-center"
                        class:text-white={chess.turn()===BLACK}
                        class:text-black={chess.turn()===WHITE}
                        class:bg-white={chess.turn()===WHITE} 
                        class:bg-black={chess.turn()===BLACK}>
                        {chess.turn()===WHITE ? 'White' : 'Black'}'s turn
                        </p>
                    {/if}
                {/if}
            </div>
            <p class="font-bold !text-xl">
                {#if getOrientation(chessGame)==='white'}
                    {chess.header().Black}
                {:else} 
                    {chess.header().White}
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
                    <button class="btn w-full variant-glass-secondary h-[25%] promo-queen-{getPlayingColor(chessGame) || 'white'}" on:click={async () => await doPromotion('q')}></button>
                    <button class="btn w-full variant-glass-secondary h-[25%] promo-rook-{getPlayingColor(chessGame) || 'white'}" on:click={async () => await doPromotion('r')}></button>
                    <button class="btn w-full variant-glass-secondary h-[25%] promo-knight-{getPlayingColor(chessGame) || 'white'}" on:click={async () => await doPromotion('n')}></button>
                    <button class="btn w-full variant-glass-secondary h-[25%] promo-bischop-{getPlayingColor(chessGame) || 'white'}" on:click={async () => await doPromotion(BLACK)}></button>
                {/if}
            </div>
    
        </div>
        <footer class="flex justify-between items-end">
            <div class="flex gap-1">
                <button disabled={moveStack.length===0} on:click={loadFirstMove} class="btn btn-sm variant-filled-primary">
                    <svg class="w-8 h-8" viewBox="0 0 1920 1920">
                        <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z"/>
                        <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z"/>
                    </svg>
                </button>
                <button disabled={moveStack.length===0} on:click={loadPreviousMove} class="btn btn-sm variant-filled-primary">
                    <svg class="w-8 h-8" viewBox="0 0 1920 1920">
                        <path d="m1394.006 0 92.299 92.168-867.636 867.767 867.636 867.636-92.299 92.429-959.935-960.065z" fill-rule="evenodd"/>
                    </svg>
                </button>   
                <button disabled={undoneMoveStack.length===0} on:click={loadNextMove} class="btn btn-sm variant-filled-primary">
                    <svg class="w-8 h-8 rotate-180" viewBox="0 0 1920 1920">
                        <path d="m1394.006 0 92.299 92.168-867.636 867.767 867.636 867.636-92.299 92.429-959.935-960.065z" fill-rule="evenodd"/>
                    </svg>
                </button>
                <button disabled={undoneMoveStack.length===0} on:click={loadLastMove} class="btn btn-sm variant-filled-primary">
                    <svg class="w-8 h-8 rotate-180" viewBox="0 0 1920 1920">
                        <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z"/>
                        <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z"/>
                    </svg>
                </button>
            </div>
            <p class="font-bold !text-xl">
            {#if getOrientation(chessGame)==='black'}
                {chess.header().Black}
            {:else} 
                {chess.header().White}
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
             
                    <ul id="moveList" class="overflow-scroll flex-1">
                        {#each moveStack.concat(undoneMoveStack.slice().reverse()) as move, i} 
                            {#if i%2===0}
                                <li id="move{i}" class="w-full flex gap-2">
                                    <span class="flex-1 p-1">{i/2+1}</span>
                                    <span class="flex-1 p-1 rounded-token {moveStack.length-1===i ? "bg-primary-500/50" : ""}">{move.san}</span>
                                    <span class="flex-1 p-1 rounded-token {moveStack.length-1===i+1 ? "bg-primary-500/50" : ""}">
                                        {#if moveStack.concat(undoneMoveStack.slice().reverse())[i+1]}
                                            {moveStack.concat(undoneMoveStack.slice().reverse())[i+1].san}
                                        {/if}
                                    </span>
                                </li>
                            {/if}
                        {/each}
                    </ul>
              
            
 
                {:else if tabSet === 1}
                        <p>Coming soon</p>
                {:else if tabSet === 2}
                        <!-- ON ANY OF THESE INPUTS UPDATE THE SETTINGS (WE DO A TIMEOUT FOR THE LOCALSTORAGE TO UPDATE) -->
                        <div class="flex flex-col" on:input={() => setTimeout(() => {
    
                            // If premove got turned off, cancel current premove if present
                            if (!$settings.premove) chessBoard.cancelPremove();
                            updateUI()
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
                        <label use:clipboard={chess.fen()} on:click={() => triggerCopiedToast('FEN')}>
                            FEN:
                            <input class="input" type="text" readonly value={chess.fen()} />
                        </label>
                        <label use:clipboard={chess.pgn()} on:click={() => triggerCopiedToast('PGN')}>
                            PGN:
                            <textarea class="input resize-none" rows=10 readonly value={chess.pgn()} />
                        </label>
                    </div>
 
                {/if}
            </svelte:fragment>
        </TabGroup>
  
 </div>