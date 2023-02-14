<script lang="ts">
	import { Chess, SQUARES, type Move, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
    import '../../../chessground.css';
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";
	import { localStorageStore } from "@skeletonlabs/skeleton";
    import type { Writable } from 'svelte/store';
    import { Howl } from 'howler';

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
    let moveSFX = new Howl({
        src: '/sfx/move.mp3'
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
            const updatedGame: ChessGame = payload.new as ChessGame

            const before = getLastMove();

            loadGame(updatedGame);  
            
            const after = getLastMove();

            // Check if moves before and after game update are different, if they aren't it means we've done this move (by playing it ourselves) and dont need the move sound effect
            if (before[0] !== after[0] || before[1] !== after[1]) playMoveSound();

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
            orientation: getPlayingColor(chessGame),
            turnColor: getTurnColor(chess), 
            lastMove: getLastMove(),
            viewOnly: undoneMoveStack.length!==0,
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
                enabled: $settings.premove
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

    const getPlayingColor = (chessGame: ChessGame) => {
        if (!$page.data.session) return undefined;
        return $page.data.session.user.id === chessGame.player_id_white ? 'white' : 'black';
    }

    const getTurnColor = (chess: Chess) => {
        return (chess.turn() === 'w') ? 'white' : 'black';
    }

    const getLastMove = () => {
        const undoneMove = chess.undo();
        if (undoneMove===null) return [];
        chess.move({
            from: undoneMove.from,
            to: undoneMove.to,
            promotion: undoneMove.promotion
        });
        return [undoneMove.from, undoneMove.to];
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
        playMoveSound();
        
        // If there is a promotion set the promotionMove and return so that the move doesn't get played yet (in case of a promotion cancel)
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
            // Move (throws exception if move is invalid)
            chess.move(move);
            
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

    const promote = async (promotion: 'q' | 'r' | 'n' | 'b') => {
        if (!promotionMove) return;
        await doMove({
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
        playMoveSound()
        const poppedMove = undoneMoveStack.pop();
        const move: CustomMove = {
            from: poppedMove?.from as string,
            to: poppedMove?.to as string,
            promotion: poppedMove?.promotion as 'q' | 'r' | 'n' | 'b' | undefined
        }
        chess.move(move);
        updateUI();
    }
    
    const loadLastMove = () => {
        if (undoneMoveStack.length===0) return;
        loadGame(chessGame);
    }

    const playMoveSound = () => {
        if (!$settings.sfx) return;
        moveSFX.play();
    }
    
    onDestroy(() => {
        channel.unsubscribe();
    });

    let tabSet: number = 0;
</script>

<svelte:window 
    on:click={(event) => {
        if (!promotionModal.contains(event.target) && promotionMove!==null) {
            cancelPromote();
        }
    }}
    on:keydown={(event) => {
        if (event.key==='ArrowLeft') loadPreviousMove();
        if (event.key==='ArrowRight') loadNextMove();
    }} 
 />


 


 <div class="mx-auto flex justify-evenly">
    <div class="flex flex-col gap-2 w-min">
        <header class="flex justify-between">
            <div class="flex gap-2">
                {#if chess}
                    {#if chess.isGameOver()}
                        <p  class="p-3 rounded-token font-semibold text-center bg-surface-300-600-token">
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
            <p class="font-semibold !text-lg">Player 2</p>
        </header>
    
        <!-- BOARD-WRAPPER -->
        <div class="relative h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
    
            <!-- BOARD -->
            <div class="flex justify-center items-center rounded-token" class:brightness-50={promotionMove!==null} bind:this={boardElement}>
                <p class="!text-[vw] animate-bounce">
                    🍑
                    Loading board...
                </p>
            </div>
    
            <!-- PROMOTION-MODAL -->
            <div bind:this={promotionModal} class:hidden={promotionMove===null} class="absolute top-0 left-[50%] translate-x-[-50%] z-[999] card p-4 m-4 bg-surface-600-300-token flex flex-col gap-2">
                <div class="flex gap-2">
                    <button class="btn variant-filled-secondary flex-1" on:click={async () => await promote('q')}>Q</button>
                    <button class="btn variant-filled-secondary flex-1" on:click={async () => await promote('r')}>R</button>
                </div>
                <div class="flex gap-2">
                        <button class="btn variant-filled-secondary flex-1" on:click={async () => await promote('n')}>K</button>
                        <button class="btn variant-filled-secondary flex-1" on:click={async () => await promote('b')}>B</button>
                </div>
            </div>
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
                    <svg class="w-8 h-8"  viewBox="0 0 1920 1920">
                        <path d="m1394.006 0 92.299 92.168-867.636 867.767 867.636 867.636-92.299 92.429-959.935-960.065z" fill-rule="evenodd"/>
                    </svg>
                </button>   
                <button disabled={undoneMoveStack.length===0} on:click={loadNextMove} class="btn btn-sm variant-filled-primary">
                    <svg class="w-8 h-8 rotate-180"  viewBox="0 0 1920 1920">
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
            <p class="font-semibold !text-lg">Player 1</p>
        </footer>
    </div>
    <div class="h-[min(calc(100vw)-1rem,calc(95vh-12rem))] p-4">
        <h2 class="font-bold">Analysis</h2>
        <hr class="my-4" />
        <ul class="overflow-scroll h-full">
            {#each totalMoveHistory as move, i} 
            {#if i%2===0}
                <li class="w-full flex">    
                    <span class="w-[50%] p-1" class:bg-red-600={0+currentMoveHistory.length-1===i}>{move}</span>
                    <span class="w-[50%] p-1" class:bg-red-600={0+currentMoveHistory.length-1===i+1}>{totalMoveHistory[i+1]}</span>
                </li>
            {/if}
        {/each}
        </ul>
    </div>
 </div>





<!-- TODO PREFERENCES MODAL -->
<!-- <div class="flex flex-col">
    <SlideToggle name="animate" bind:checked={$settings.animate} on:input={() => setTimeout(() => {updateUI}, 500)}>Animate</SlideToggle>
    <SlideToggle name="sfx" bind:checked={$settings.sfx} on:input={() => setTimeout(() => {updateUI}, 500)} >SFX</SlideToggle>
    <SlideToggle name="premove" bind:checked={$settings.premove} on:input={() => setTimeout(() => {updateUI}, 500)}>Premove</SlideToggle>
    <SlideToggle name="drag" bind:checked={$settings.drag} on:input={() => setTimeout(() => {updateUI}, 500)}>Drag</SlideToggle>
</div> -->