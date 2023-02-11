<script lang="ts">
	import { Chess, SQUARES, type Square } from "chess.js";
    import type { PageData } from "./$types";
    import { Chessground } from 'chessground';
	import { onMount, onDestroy } from "svelte";
    import '../../../chessground.css';
	import { supabase } from "$lib/supabase";
	import { page } from "$app/stores";

    export let data: PageData;

    let chessGame: ChessGame;
    let chess: Chess;
 
    let chessBoard: any;
    onMount(() => {
        chessBoard = Chessground(document.getElementById("board") as HTMLElement);
        chessGame = data.chessGame;
        loadGame(chessGame);
    });

    const loadGame = (chessGame: ChessGame) => {
        chessGame = chessGame;
        chess = new Chess(chessGame.history[chessGame.history.length-1].fen);
        chessBoard.set(getConfig(chess, chessGame));
    }
    
    const getConfig = (chess: Chess, chessGame: ChessGame) => {
        return {
            fen: chess.fen(),
            orientation: getPlayingColor(chessGame),
            turnColor: getTurnColor(chess), 
            lastMove: getLastMove(chessGame),
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
                enabled: true,
                showDests: true
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

    const getPlayingColor = (chessGame: ChessGame) => {
        if (!$page.data.session) return undefined;
        return $page.data.session.user.id === chessGame.player_id_white ? 'white' : 'black';
    }

    const getTurnColor = (chess: Chess) => {
        return (chess.turn() === 'w') ? 'white' : 'black';
    }

    const getLastMove = (chessGame: ChessGame) => {
        return [chessGame.history[chessGame.history.length-1].move.from, chessGame.history[chessGame.history.length-1].move.to];
    }

    const getValidDestinations = (chess: Chess) => {
        const dests = new Map();
        SQUARES.forEach(s => {
            const ms = chess.moves({square: s, verbose: true});
            if (ms.length) dests.set(s, ms.map(m => m.to));
        });
        return dests;
    }

    const moveCallback = async (orig: Square, dest: Square) => {

        // TODO: Handle promotion logic
        const move = {
            from: orig,
            to: dest
        }

        chess.move(move);

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
            loadGame(payload.new as ChessGame);
            if (chess.isGameOver()) {
                // TODO: Game over
            }

            // If game is reloaded and still going on, play any remaining premoves
            chessBoard.playPremove();
        }
    )
    .subscribe();

    onDestroy(() => {
        channel.unsubscribe();
    });
</script>

<div class="w-[min(50rem,98vw)] aspect-square mx-auto">
    <div id="board"></div>
</div>


