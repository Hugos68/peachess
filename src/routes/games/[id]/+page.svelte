<script lang="ts">
	import { Chess, SQUARES, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
    import '../../../chessground.css';
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";

    export let data: PageData;
    let chessGame: ChessGame, chess: Chess, chessBoard: any, currentMoveIndex: number;
    onMount(() => {
        chessBoard = Chessground(document.getElementById("board") as HTMLElement);

        chessGame = data.chessGame;

        currentMoveIndex = chessGame.history.length-1;

        loadState(chessGame);
    });
    

    const getConfig = (chess: Chess) => {
        return {
            fen: chess.fen(),
            orientation: getPlayingColor(),
            turnColor: getTurnColor(chess), 
            lastMove: getLastMove(chessGame),
            check: chess.inCheck(),
            highlight: {
                lastMove: true,  
            },
            movable: {
                color: getPlayingColor(),
                free: false,
                dests: getValidDestinations(chess)
            },
            draggable: {
                showGhost: true
            },
            drawable: {
                enabled: true
            },
            events: {
                move: moveCallback
            }
        }
    }

    const getValidDestinations = (chess: Chess) => {
        const dests = new Map();
        SQUARES.forEach(s => {
            const ms = chess.moves({square: s, verbose: true});
            if (ms.length) dests.set(s, ms.map(m => m.to));
        });
        return dests;
    }

    const getTurnColor = (chess: Chess) => {
        return (chess.turn() === 'w') ? 'white' : 'black';
    }

    const getPlayingColor = () => {
        if (!$page.data.session) return undefined;
        return $page.data.session.user.id === chessGame.player_id_white ? 'white' : 'black';
    }

    const getLastMove = (chessGame: ChessGame) => {
        return [chessGame.history[currentMoveIndex].move.from, chessGame.history[currentMoveIndex].move.to];
    }

    const moveCallback = async (orig: Square, dest: Square) => {

        // TODO: Handle promotion logic
        const move = {
            from: orig,
            to: dest
        }

        chess.move(move);

        chessBoard.set(getConfig(chess));
        const {data, error} = await supabase.functions.invoke('move', {
            body : {
                gameId: chessGame.id,
                move
            }
        });
    }

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
            loadState(payload.new as ChessGame);

            if (chess.isGameOver()) {
                // TODO: Game over
            }
        }
    )
    .subscribe();

    onDestroy(() => {
        channel.unsubscribe();
    });

    const previousMove = () => {
        if (currentMoveIndex > 0) currentMoveIndex-=1;
        loadState(chessGame);
    }
    const nextMove = () => {
        if (currentMoveIndex < chessGame.history.length-1) currentMoveIndex +=1;
        loadState(chessGame);
    }


    const loadState = (chessGame: ChessGame) => {
        chess = new Chess(chessGame.history[currentMoveIndex].fen);
        chessBoard.set(getConfig(chess));
    }
</script>

<div class="w-[min(50rem,98vw)] aspect-square mx-auto">
    <div id="board"></div>
</div>
<button on:click={previousMove} class="btn variant-filled-primary">Previous</button>
<button on:click={nextMove} class="btn variant-filled-primary">Next</button>


