<script lang="ts" type="module">
	import { Chess, SQUARES, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
    import '../../../chessground.css';
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";

    let chessBoard;
    onMount(() => {
        const config = getConfig(chess, chess);
        chessBoard = Chessground(document.getElementById("board") as HTMLElement, config);
    });

    const getConfig = (oldChess: Chess, chess: Chess) => {
        
        return {
            fen: chess.fen(),
            orientation: getPlayingColor(chess),
            turnColor: getTurnColor(chess),
            highlight: {
                lastMove: true,  
            },
            movable: {
                color: getPlayingColor(chess),
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
                // called after a piece has been moved.
                // capturedPiece is null or like {color: 'white', 'role': 'queen'}
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

    const getPlayingColor = (chess: Chess) => {
        return $page.data.session.user.id === chessGame.player_id_white ? 'white' : 'black';
    }

    const moveCallback = async (orig: Square, dest: Square) => {
        const {data, error} = await supabase.functions.invoke('move', {
            body : {
                gameId: chessGame.id,
                move: orig.toString() + dest.toString(),
            }
        });
    }

    onDestroy(() => {
        channel.unsubscribe();
    });

    export let data: PageData;
    let chessGame: ChessGame = data.chessGame;
    let chess: Chess = new Chess(chessGame.history[chessGame.history.length-1]);

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
            chessGame = payload.new as ChessGame;
            chess = new Chess(chessGame.history[chessGame.history.length-1]);
            chessBoard.set(getConfig(chess));
            if (chess.isGameOver()) {
                // TODO: Game over
            }
        }
    )
    .subscribe();
</script>

<div class="card p-4 w-[50rem] h-[50rem] mx-auto">
    <div id="board"></div>
</div>

