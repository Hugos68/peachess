import { Chess, type Move, type Square } from "chess.js";
import { writable, type Writable, get } from "svelte/store";
import { getConfig, getMaterial, updateMaterial, playMoveSound, getAINameByDifficulity } from "$lib/util";
import { supabase } from '$lib/supabase';
import { settings} from './settings-store';

export function createOnlineChessStateStore(chessGame: OnlineChessGame, playingColor: 'w' | 'b' | undefined): OnlineChessStateStore {

    // Init chessState by loading pgn into chess and loading history into the move stack
    const chess = new Chess();
    chess.loadPgn(chessGame.pgn);
    const moveStack: Move[] = chess.history({verbose: true});
    const undoneMoveStack: Move[] = [];
    const material = getMaterial(moveStack);
    const boardConfig = getConfig(chess, playingColor, moveStack, undoneMoveStack);

    const onlineChessState: OnlineChessState = {
        chessGame,
        playingColor,
        chess,
        moveStack,
        undoneMoveStack,
        material,
        boardConfig
    }

    return onlineChessStateStore(onlineChessState);
}

const onlineChessStateStore = (chessState: OnlineChessState): OnlineChessStateStore => {

    const { set, update, subscribe }: Writable<OnlineChessState> = writable<OnlineChessState>(chessState);

    const store = {
        set,
        update,
        subscribe,
        loadPgn: (pgn: string) => {
            update(chessState => {
                chessState.chessGame.pgn = pgn;
                chessState.chess.loadPgn(chessState.chessGame.pgn);
                chessState.undoneMoveStack = [];
                chessState.moveStack = chessState.chess.history({verbose: true});
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack); 
                return chessState;
            });
        },
        loadFirstMove: () => {
            update(chessState => {
                if (chessState.moveStack.length===0) return chessState;
                const headers = chessState.chess.header();
                chessState.chess.reset();
                for (const [key, value] of Object.entries(headers)) chessState.chess.header(key, value);
                chessState.undoneMoveStack = chessState.undoneMoveStack.concat(chessState.moveStack.reverse());
                chessState.moveStack = [];
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        loadPreviousMove: () => {
            update(chessState => {
                if (!chessState.chess.undo() && chessState.moveStack.length===0) return chessState;
                const move = chessState.moveStack.pop();
                if (get(settings).sfx) playMoveSound(move);
                chessState.undoneMoveStack.push(move);
                chessState.material = updateMaterial(chessState.material, move, 'subtract');
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        loadNextMove: () => {
            update(chessState => {   
                if (chessState.undoneMoveStack.length===0) return chessState;
                const move = chessState.undoneMoveStack.pop();
                if (!move) return chessState;
                if (get(settings).sfx) playMoveSound(move)            
                chessState.moveStack.push(move);
                chessState.chess.move(move);
                chessState.material = updateMaterial(chessState.material, move, 'add');
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        loadLastMove: () => {
            update(chessState => {
                if (chessState.undoneMoveStack.length===0) return chessState;
                chessState.chess.loadPgn(chessState.chessGame.pgn);
                chessState.moveStack = chessState.moveStack.concat(chessState.undoneMoveStack.reverse());
                chessState.undoneMoveStack = [];
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
            
        },
        move: (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b')   => {
            let move;
            update(chessState => {
                try {

                    // Move (throws exception if move is invalid)
                    move = chessState.chess.move({from, to, promotion});
                    if (get(settings).sfx) playMoveSound(move)
                    chessState.moveStack.push(move);
                    chessState.material = getMaterial(chessState.moveStack);
                    chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                    chessState.chessGame.pgn = chessState.chess.pgn();

                    // Execute the move to the database
                    supabase.functions.invoke('move', {
                        body : {
                            gameId: chessState.chessGame.id,
                            move: {
                                from, 
                                to,
                                promotion
                            }
                        }
                    });
                } catch(error) {
                    console.error(error);
                }
                return chessState;
            });
            return move;
        }
    }
    
    supabase
    .channel('table-db-changes')
    .on(
        'postgres_changes',
        {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${chessState.chessGame.id}`
        },
        // This callback is called whenever this game gets an update, payload contains the old and new version
        (payload) => {
            const updatedChessGame: OnlineChessGame = payload.new as OnlineChessGame
            const chessState = get(store);

            // Check if updated game state is in sync with stores gamestate, if not, load the updated game state and play a move sound (because this means the opponent has moved a)
            if (updatedChessGame.pgn !== chessState.chessGame.pgn) {
                store.loadPgn(updatedChessGame.pgn);
                playMoveSound(chessState.moveStack[chessState.moveStack.length-1]);
            }
        }
    )
    .subscribe();

    return store;
}

export function createAIChessStateStore(AIDifficulity: 0 | 1 | 2 | 3 | 4, playingColor: 'w' | 'b' | undefined): AIChessStateStore {
    
    const chess = new Chess();
    chess.header('Event', 'Chess Game');
    chess.header('Site', 'https://peachess.vercel.app/');
    chess.header('Date', new Date());
    chess.header('Round', null);
    chess.header(playingColor==='w' ? 'White' : 'Black', "You");
    chess.header(playingColor==='w' ? 'Black' : 'White', getAINameByDifficulity(AIDifficulity));
    chess.header('Result', '*');
    
    const chessGame: AIChessGame = {
        AIDifficulity,
        pgn: chess.pgn()
    }
    const moveStack: Move[] = chess.history({verbose: true});
    const undoneMoveStack: Move[] = [];
    const material = getMaterial(moveStack);
    const boardConfig = getConfig(chess, playingColor, moveStack, undoneMoveStack);

    const AIChessState: AIChessState = {
        chessGame,
        playingColor,
        chess,
        moveStack,
        undoneMoveStack,
        material,
        boardConfig
    }

    return AIChessStateStore(AIChessState);
}

let stockfish;
const AIChessStateStore = (chessState: AIChessState): AIChessStateStore => {

    const { set, update, subscribe }: Writable<AIChessState> = writable<AIChessState>(chessState);

    const loadPgn = (pgn: string) => {
        update(chessState => {
            chessState.chessGame.pgn = pgn;
            chessState.chess.loadPgn(chessState.chessGame.pgn);
            chessState.undoneMoveStack = [];
            chessState.moveStack = chessState.chess.history({verbose: true});
            chessState.material = getMaterial(chessState.moveStack);
            chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
            return chessState;
        });
    }

    return {
        set,
        update,
        subscribe,
        loadPgn,
        loadFirstMove: () => {
            update(chessState => {
                if (chessState.moveStack.length===0) return chessState;
                const headers = chessState.chess.header();
                chessState.chess.reset();
                for (const [key, value] of Object.entries(headers)) chessState.chess.header(key, value);
                chessState.undoneMoveStack = chessState.undoneMoveStack.concat(chessState.moveStack.reverse());
                chessState.moveStack = [];
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        loadPreviousMove: () => {
            update(chessState => {
                if (!chessState.chess.undo() && chessState.moveStack.length===0) return chessState;
                const move = chessState.moveStack.pop();
                if (get(settings).sfx) playMoveSound(move);
                chessState.undoneMoveStack.push(move);
                chessState.material = updateMaterial(chessState.material, move, 'subtract');
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        loadNextMove: () => {
            update(chessState => {     
                if (chessState.undoneMoveStack.length===0) return chessState;
                const move = chessState.undoneMoveStack.pop();
                if (!move) return chessState;
                if (get(settings).sfx) playMoveSound(move)     
                chessState.moveStack.push(move);
                chessState.chess.move(move);
                chessState.material = updateMaterial(chessState.material, move, 'add');
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        loadLastMove: () => {
            update(chessState => {
                if (chessState.undoneMoveStack.length===0) return chessState;
                chessState.chess.loadPgn(chessState.chessGame.pgn);
                chessState.moveStack = chessState.moveStack.concat(chessState.undoneMoveStack.reverse());
                chessState.undoneMoveStack = [];
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
            
        },
        move: async (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b')  => {
            if (!window.Worker) return;
            if (!stockfish) {
                stockfish = new Worker('/stockfish/src/stockfish.js');
                stockfish.postMessage('ucinewgame');
            }

            stockfish.onmessage = function(e) {
                if (!e.data.includes('bestmove')) return;
                const segments = e.data.split(' ');
                const move = segments[1];
                const from = move.substring(0, 2);
                const to = move.substring(2, 4);
                const promotion = move.substring(4);
                update(chessState => {

                    // Load latest pgn if user is not in sync with server (we do this check by checking if the undoneMoveSTack has any moves since this indicates a user has gone back in moves)
                    if (chessState.undoneMoveStack.length !== 0) loadPgn(chessState.chessGame.pgn);
    
                    // Move (t  hrows exception if move is invalid)
                    const move = chessState.chess.move({from, to, promotion});
                    if (get(settings).sfx) playMoveSound(move);
                    chessState.moveStack.push(move);
                    chessState.material = getMaterial(chessState.moveStack);
                    chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                    chessState.chessGame.pgn = chessState.chess.pgn();
                    return chessState;
                });
            }
        
            update(chessState => {
                try {
                    // Move (throws exception if move is invalid)
                    const move = chessState.chess.move({from, to, promotion});
                    if (get(settings).sfx) playMoveSound(move);
                    chessState.moveStack.push(move);
                    chessState.material = getMaterial(chessState.moveStack);
                    chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                    chessState.chessGame.pgn = chessState.chess.pgn();
                } catch(error) {
                    console.error(error);
                }
                stockfish.postMessage('position fen '+ chessState.chess.fen());
                stockfish.postMessage('go');
                return chessState;
            });
        }
    }
}