import { Chess, type Move, type Square } from "chess.js";
import { writable, type Writable, get } from "svelte/store";
import { getConfig, getMaterial, updateMaterial, playMoveSound } from "$lib/util";
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

    return onlineChessStateStore(onlineChessState, supabase);
}

const onlineChessStateStore = (chessState: OnlineChessState, supabase: SupabaseClient): OnlineChessStateStore => {

    const { set, update, subscribe }: Writable<OnlineChessState> = writable(chessState);

    const store = {
        set,
        update,
        subscribe,
        loadPgn: (pgn: string) => {
            update(chessState => {

                chessState.chessGame.pgn = pgn;
                chessState.chess.loadPgn(chessState.chessGame.pgn)

                const moveAmountBeforeUpdating = chessState.moveStack.length + chessState.undoneMoveStack.length;

                chessState.undoneMoveStack = [];
                chessState.moveStack = chessState.chess.history({verbose: true});
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack); 

                const moveAmountAfterUpdating = chessState.moveStack.length + chessState.undoneMoveStack.length;
                
                if (moveAmountBeforeUpdating < moveAmountAfterUpdating) playMoveSound(chessState.moveStack[chessState.moveStack.length-1]);

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
            if (!chessState.chess.undo()) return;
            update(chessState => {
                if (chessState.moveStack.length===0) return chessState;
                const move = chessState.moveStack.pop()
                chessState.undoneMoveStack.push(move);
                chessState.material = updateMaterial(chessState.material, move, 'subtract');
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        loadNextMove: () => {
            if (chessState.undoneMoveStack.length===0) return chessState;
            const move = chessState.undoneMoveStack.pop();
            if (!move) return;
            if (get(settings).sfx) playMoveSound(move)
            update(chessState => {          
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
            store.loadPgn(updatedChessGame.pgn);
        }
    )
    .subscribe();

    return store;
}

export function createAIChessStateStore(chessGame: AIChessGame, playingColor: 'w' | 'b' | undefined): AIChessStateStore {
        
    const chess = new Chess();
    chess.loadPgn(chessGame.pgn);
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

    return AIChessStateStore(AIChessState)
}

const AIChessStateStore = (chessState: ChessState): AIChessStateStore => {

    const { set, update, subscribe }: Writable<AIChessState> = writable(chessState);

    return {
        set,
        update,
        subscribe,
        loadPgn: (pgn: string) => {
            update(chessState => {

                chessState.pgn = pgn;
                chessState.chess.loadPgn(chessState.pgn)

                const moveAmountBeforeUpdating = chessState.moveStack.length + chessState.undoneMoveStack.length;

                chessState.undoneMoveStack = [];
                chessState.moveStack = chessState.chess.history({verbose: true});
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);

                const moveAmountAfterUpdating = chessState.moveStack.length + chessState.undoneMoveStack.length;
                
                if (moveAmountBeforeUpdating < moveAmountAfterUpdating) playMoveSound(chessState.moveStack[chessState.moveStack.length-1]);

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
            if (!chessState.chess.undo()) return;
            update(chessState => {
                if (chessState.moveStack.length===0) return chessState;
                const move = chessState.moveStack.pop()
                chessState.undoneMoveStack.push(move);
                chessState.material = updateMaterial(chessState.material, move, 'subtract');
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        loadNextMove: () => {
            if (chessState.undoneMoveStack.length===0) return chessState;
            const move = chessState.undoneMoveStack.pop();
            if (!move) return;
            if (get(settings).sfx) playMoveSound(move)
            update(chessState => {          
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
                chessState.chess.loadPgn(chessState.pgn);
                chessState.moveStack = chessState.moveStack.concat(chessState.undoneMoveStack.reverse());
                chessState.undoneMoveStack = [];
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
            
        },
        move: async (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b')  => {
            update(chessState => {
                try {
                    // Move (throws exception if move is invalid)
                    const move = chessState.chess.move({from, to, promotion});
                    if (get(settings).sfx) playMoveSound(move);
                    chessState.moveStack.push(move);
                    chessState.material = getMaterial(chessState.moveStack);
                    chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                    chessState.pgn = chessState.chess.pgn();
                } catch(error) {
                    console.error(error);
                }
                return chessState;
            });

            let chessState;
            subscribe(value => {
                chessState = value;
            })

            const {data, error} = await supabase.functions.invoke('get_ai_move', {
                body:  {
                    fen: chessState.chess.fen(),
                    AIDifficulity: chessState.AIDifficulity
                }
            });
            update(chessState => {
                try {
                    // Move (throws exception if move is invalid)
                    const move = chessState.chess.move({
                        from:  data.move.from,
                        to: data.move.to,
                        promotion: data.move.promotion,
                    });
                    if (get(settings).sfx) playMoveSound(move);
                    chessState.moveStack.push(move);
                    chessState.material = getMaterial(chessState.moveStack);
                    chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                    chessState.pgn = chessState.chess.pgn();
                } catch(error) {
                    console.error(error);
                }
                return chessState;
            });
        }
    }
}