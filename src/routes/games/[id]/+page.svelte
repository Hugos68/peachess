<script lang="ts">
	import { Chess, SQUARES, type Move, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
    import '../../../chessground.css';
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";
	import { invalidateAll } from "$app/navigation";

    export let data: PageData;

    $: chessGame = data.chessGame;

    let moveSFX: HTMLAudioElement;

    let chess: Chess = new Chess();
    let chessBoard: any;
    let boardElement: HTMLElement;
    let promotionModal: HTMLElement;
    let undoneMoveStack: Move[] = [];
    onMount(() => {
        moveSFX = new Audio('/sfx/move.mp3');
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
        (payload) => {

            // Only play game sound when its a move that isnt in our pgn yet
            if (payload.new.pgn!==chess.pgn()) {
                moveSFX.play();
            }
            
            loadGame(payload.new as ChessGame);

            // If game is reloaded and still going on, play any remaining premoves
            chessBoard.playPremove();
        }
    )
    .subscribe();

    const loadGame = (newChessGame: ChessGame) => {
        chessGame = newChessGame;
        chess.loadPgn(chessGame.pgn);

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
                enabled: false,
            },
            draggable: {
                enabled: false
            },
            drawable: {
                enabled: true
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
        moveSFX.play();

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

        // Indalidate page data to retrigger populate chessGame with updated version from database
        await invalidateAll();
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
        moveSFX.play();
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
        updateUI();
    }
    
    onDestroy(() => {
        channel.unsubscribe();
    });
</script>

<svelte:window on:click={(event) => {
    if (!promotionModal.contains(event.target) && promotionMove!==null) {
        cancelPromote();
    }
}} />



<div class="mx-auto flex flex-col lg:flex-row card variant-ghost-primary  overflow-hidden">

    <!-- BOARD-LEFT-PANEL -->
    <div class="flex-1 flex flex-col justify-between p-4">
        {#if chess}
            <div class="flex flex-wrap gap-2 justify-between items-center">
                <a class="btn variant-filled-primary w-fit" href="/games">Go back</a>
                <p
                class:text-white={chess.turn()==='b'}
                class:text-black={chess.turn()==='w'}
                class:bg-white={chess.turn()==='w'} 
                class:bg-black={chess.turn()==='b'}
                class:bg-surface-300-600-token={chess.isGameOver()}
                class="p-3 rounded-token font-semibold text-center !text-md lg:!text-xl">
                {#if chess.isGameOver()}
                    Game ended:
                {#if chess.isCheckmate()}
                    <p>{chess.turn() === 'w' ? 'Black' : 'White'} won with checkmate</p>
                {:else if chess.isStalemate()}
                    <p>Stalemate</p>
                {:else if chess.isDraw()}
                    <p>Draw</p>
                {/if}
                {:else}
                    {chess.turn()==='w' ? 'White' : 'Black'}'s turn
                {/if}
                </p>
            </div>
            <div class="flex justify-between">
                <div class="flex gap-1">
                    <button disabled={!getLastMove()} on:click={loadFirstMove} class="btn btn-sm variant-filled-primary w-min">
                        <svg class="w-8 h-8" viewBox="0 0 1920 1920">
                            <g fill-rule="evenodd">
                                <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z"/>
                                <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z"/>
                            </g>
                        </svg>
                    </button>
                    <button disabled={!getLastMove()} on:click={loadPreviousMove} class="btn btn-sm variant-filled-primary">
                        <svg class="w-8 h-8"  viewBox="0 0 1920 1920">
                            <path d="m1394.006 0 92.299 92.168-867.636 867.767 867.636 867.636-92.299 92.429-959.935-960.065z" fill-rule="evenodd"/>
                        </svg>
                    </button>
                    {#key undoneMoveStack}
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
                    {/key}
                </div>
                <span class="relative">
                    <button class="btn btn-sm variant-filled-secondary">
                        <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12V17C5 18.6569 6.34315 20 8 20H16C17.6569 20 19 18.6569 19 17V12M12 16V4M12 4L8 8M12 4L16 8" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </span>
            </div>
        {/if}
    </div>
    
    <!-- BOARD-WRAPPER -->
    <div class="w-[min(100%,calc(100vh-var(--header-height)))] aspect-square relative">
        <!-- BOARD -->
        <div class:brightness-50={promotionMove!==null} bind:this={boardElement}></div>

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
</div>




