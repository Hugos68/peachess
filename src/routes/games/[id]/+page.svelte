<script lang="ts">
	import { Chess, SQUARES, type Move, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
    import '../../../chessground.css';
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";
	import { localStorageStore, SlideToggle, Tab, TabGroup } from "@skeletonlabs/skeleton";
    import type { Writable } from 'svelte/store';
    import { Howl } from 'howler';
	import { fly } from "svelte/transition";

    export let data: PageData;

    $: chessGame = data.chessGame;

    let chess: Chess = new Chess();

    let totalMoveHistory: string[] = [];
    $: currentMoveHistory = chess.history();
    let undoneMoveStack: Move[] = [];

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
    const checkSFX = new Howl({
        src: '/sfx/check.mp3'
    });
    onMount(() => {
        chessBoard = Chessground(boardElement);
        loadGame(data.chessGame);
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

            const lastMovebefore = getLastMove();

            loadGame(updatedChessGame);  
            
            const lastMoveafter = getLastMove();

            // Check if moves before and after game update are different, if they aren't it means we've done this move (by playing it ourselves) and dont need the move sound effect
            if (lastMovebefore?.from !== lastMoveafter?.from || lastMovebefore?.to !== lastMoveafter?.to) playMoveSound();

            // Once game is reloaded play any premoves the player might have
            chessBoard.playPremove();
        }
    )
    .subscribe();
        
    const loadGame = (newChessGame: ChessGame) => {
        chessGame = newChessGame;
        chess.loadPgn(chessGame.pgn);

        totalMoveHistory = chess.history();

        // Clear the undone move stack since the chess object was resassigned
        undoneMoveStack = [];
        updateUI();
    } 

    const updateUI = () => {
        chess = chess;
        chessGame = chessGame;
        undoneMoveStack = undoneMoveStack;
        chessBoard.set(getConfig(chess, chessGame));
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
        return (chess.turn() === 'w') ? 'white' : 'black';
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
        const undoneMove = chess.undo();
        if (undoneMove===null) return;
        chess.move({
            from: undoneMove.from,
            to: undoneMove.to,
            promotion: undoneMove.promotion
        });
        return undoneMove;
    }

    const getValidDestinations = (chess: Chess) => {
        const dests = new Map();

        // // When the undoneMovestack
        // if (undoneMoveStack.length!==0) return dests;
        SQUARES.forEach(s => {
            const ms = chess.moves({square: s, verbose: true});
            if (ms.length) dests.set(s, ms.map(m => m.to));
        });
        return dests;
    }

    let promotionMove: CustomMove | null = null;
    const moveCallback = async (orig: Square, dest: Square) => {        
        
        // If there is a promotion set the promotionMove and return so that the move doesn't get played yet (in case of a promotion cancel)
        const promotion = checkIfPromotion(orig, dest);
        if (promotion) { 
            promotionModalOffsetPercentage = getPromotionModalOffsetPercentage(dest);
            promotionMove = {
                from: orig,
                to: dest
            }
            return;
        }
        doMove({
            from: orig as string,
            to: dest as string
        });
    }

    const doMove = async (move: CustomMove) => {
        
        try {
            // Move (throws exception if move is invalid)
            chess.move(move);
            playMoveSound();
            
            updateUI();
        } catch(error) {
            console.error(error);
            return;
        }
        
        // Execute the move to the database
        const {error, data} = await supabase.functions.invoke('move', {
            body : {
                gameId: chessGame.id,
                move
            }
        });

        // Reload to last known stable state if anything goes wrong
        if (error) loadGame(chessGame);
    }

    const checkIfPromotion = (orig: Square, dest: Square): boolean => {
        const {type, color} = chess.get(orig);
        const rankNumber =  Number.parseInt(dest.charAt(1));

        if (type!=='p') return false;
        if (color==='w' && rankNumber!==8) return false;
        if (color==='b' && rankNumber!==1) return false;

        return true;
    }

    let promotionModalOffsetPercentage: number;

    const getPromotionModalOffsetPercentage = (toSquare: Square)=> {
        const letter = toSquare.charAt(0) || 'a';
        const number = parseInt(letter, 36) - 9;
        const percentage = (number-1) * 12.5;

        // We check color here to deal with the board orientation
        return getOrientation(chessGame) === 'white' ? percentage : 87.5-percentage;
    }

    const promote = async (promotion: 'q' | 'r' | 'n' | 'b') => {
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
        updateUI();
    }

    const loadFirstMove = () => {
        if (!getLastMove()) return;
        let undoneMove;
        while ((undoneMove = chess.undo())!==null) undoneMoveStack.push(undoneMove);
        updateUI();
    }

    const loadPreviousMove =() => {
        const move = chess.undo();
        if (move===null) return;
        undoneMoveStack.push(move);
        updateUI();
    }

    const loadNextMove = () => {
        if (undoneMoveStack.length===0) return;
        const poppedMove = undoneMoveStack.pop();
        const move: CustomMove = {
            from: poppedMove?.from as string,
            to: poppedMove?.to as string,
            promotion: poppedMove?.promotion as 'q' | 'r' | 'n' | 'b' | undefined
        }
        chess.move(move);
        playMoveSound()
        updateUI();
    }
    
    const loadLastMove = () => {
        if (undoneMoveStack.length===0) return;
        loadGame(chessGame);
    }

    const playMoveSound = () => {
        if (!$settings.sfx) return;
        const move = getLastMove();
        if (move?.san.includes('+')) checkSFX.play();
        else if (move?.san.includes('x'))captureSFX.play();
        else moveSFX.play();
    }
    
    onDestroy(() => {
        channel.unsubscribe();
    });

    let tabSet: number = 0;
</script>

<svelte:window 
    on:mousedown={(event) => {
        if (!promotionModal.contains(event.target) && promotionMove!==null) cancelPromote();
    }}
    on:keydown={(event) => {
        if (event.key==='ArrowLeft') loadPreviousMove();
        if (event.key==='ArrowRight') loadNextMove();
    }} 
 /> 

 <div class="mx-auto flex flex-col xl:flex-row justify-center items-center gap-12">
    <div class="flex flex-col gap-4">
        <header class="flex justify-between">
            <div class="flex gap-2">
                {#if chess}
                    {#if chess.isGameOver()}
                        <p  class="p-2 rounded-token font-semibold text-center bg-secondary-700">
                        {#if chess.isCheckmate()}
                            {chess.turn() === 'w' ? 'Black' : 'White'} won with checkmate
                        {:else if chess.isStalemate()}
                            Stalemate
                        {:else if chess.isDraw()}
                            Draw    
                        {/if}
                        </p>
                    {:else}
                        <p
                        class="p-3 rounded-token font-semibold text-center"
                        class:text-white={chess.turn()==='b'}
                        class:text-black={chess.turn()==='w'}
                        class:bg-white={chess.turn()==='w'} 
                        class:bg-black={chess.turn()==='b'}>
                        {chess.turn()==='w' ? 'White' : 'Black'}'s turn
                        </p>
                    {/if}
                {/if}
            </div>
            <p class="font-semibold !text-lg">
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
                    🍑
                    Loading board...
                </p>
            </div>
    
            <!-- PROMOTION-MODAL -->
            {#key promotionMove}
            <!-- TODO SET LEFT VALUE TO (ABC -> 123) * 12.5% -->
                <div in:fly={{y: 50, duration: 150}} class:hidden={!promotionMove} bind:this={promotionModal} class="absolute top-0 w-[12.5%] h-[50%] z-[50] card" style="left: {promotionModalOffsetPercentage}%;">
                    <button class="btn variant-ghost-surface w-full h-[25%] promo-queen-{getPlayingColor(chessGame) || 'white'}" on:click={async () => await promote('q')}></button>
                    <button class="btn variant-ghost-surface w-full h-[25%] promo-rook-{getPlayingColor(chessGame) || 'white'}" on:click={async () => await promote('r')}></button>
                    <button class="btn variant-ghost-surface w-full h-[25%] promo-knight-{getPlayingColor(chessGame) || 'white'}" on:click={async () => await promote('n')}></button>
                    <button class="btn variant-ghost-surface w-full h-[25%] promo-bischop-{getPlayingColor(chessGame) || 'white'}" on:click={async () => await promote('b')}></button>
                </div>
            {/key}
        </div>
        <footer class="flex justify-between items-end">
            <div class="flex gap-1">
                <button disabled={currentMoveHistory.length===0} on:click={loadFirstMove} class="btn btn-sm variant-filled-primary">
                    <svg class="w-8 h-8" viewBox="0 0 1920 1920">
                        <g fill-rule="evenodd">
                            <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z"/>
                            <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z"/>
                        </g>
                    </svg>
                </button>
                <button disabled={currentMoveHistory.length===0} on:click={loadPreviousMove} class="btn btn-sm variant-filled-primary">
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
                        <g fill-rule="evenodd">
                            <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z"/>
                            <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z"/>
                        </g>
                    </svg>
                </button>
            </div>
            <p class="font-semibold !text-lg">
            {#if getOrientation(chessGame)==='black'}
                {chess.header().Black}
            {:else} 
                {chess.header().White}
            {/if}
            </p>
        </footer>
    </div>

        <TabGroup class="h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))] card !bg-secondary-500 p-4 overflow-hidden">
            <Tab bind:group={tabSet} name="tab1" value={0}>Moves</Tab>
            <Tab bind:group={tabSet} name="tab2" value={1}>Chat</Tab>
            <Tab bind:group={tabSet} name="tab3" value={2}>Settings</Tab>
    
            <svelte:fragment slot="panel">
                {#if tabSet === 0}
                    <div class="flex gap-2">
                        <span class="flex-1 p-1"><strong>No.</strong></span>
                        <span class="flex-1 p-1"><strong>White</strong></span>
                        <span class="flex-1 p-1"><strong>Black</strong></span>
                    </div>
                    <div class="!overflow-scroll">
                        <ul>
                            {#each totalMoveHistory as move, i} 
                                {#if i%2===0}
                                    <li class="w-full flex gap-2">
                                        <span class="flex-1 p-1">{i/2+1}</span>
                                        <span class="flex-1 p-1 rounded-token {0+currentMoveHistory.length-1===i ? "bg-primary-500/50" : ""}">{move}</span>
                                        <span class="flex-1 p-1 rounded-token {0+currentMoveHistory.length-1===i+1 ? "bg-primary-500/50" : ""}">
                                            {#if totalMoveHistory[i+1]}
                                                {totalMoveHistory[i+1]}
                                            {/if}
                                        </span>
                                    </li>
                                {/if}
                            {/each}
                        </ul>
                    </div>
     
                {:else if tabSet === 1}
                    
                {:else if tabSet === 2}
                        <!-- ON ANY OF THESE INPUTS UPDATE THE SETTINGS (WE DO A TIMEOUT FOR THE LOCALSTORAGE TO UPDATE) -->
                        <div class="flex flex-col" on:input={() => setTimeout(() => {
    
                            // If premove got turned off, cancel current premove if present
                            if (!$settings.premove) chessBoard.cancelPremove();
                            updateUI()
                        }, 25)}>
                        <label class="flex items-center gap-2 justify-between">
                            Animate
                            <SlideToggle name="animate" bind:checked={$settings.animate}  />
                        </label>
                        <label class="flex items-center gap-2 justify-between">
                            Premove
                            <SlideToggle name="premove" bind:checked={$settings.premove} />
                        </label>
                        <label class="flex items-center gap-2 justify-between">
                            Drag
                            <SlideToggle name="drag" bind:checked={$settings.drag} />
                        </label>
                        <label class="flex items-center gap-2 justify-between">
                            SFX
                            <SlideToggle name="sfx" bind:checked={$settings.sfx} />
                        </label>
                    </div>
                {/if}
            </svelte:fragment>
        </TabGroup>
  
 </div>