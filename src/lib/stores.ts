import { Chess, type Move, type Square } from "chess.js";
import { writable } from "svelte/store";

export function createChessGameStore() {
    return chessGameStore();
}

const chessGameStore = () => {

    const chess: Chess = new Chess();
    const { set, update, subscribe } = writable(chess);
    
    let undoneMoveStack: Move[] = [];
    let moveStack: Move[] = [];

    return {
        set,
        update,
        subscribe,
        loadGame: (chessGame: chessGame) => {
            update(value => {
                value.loadPgn(chessGame.pgn)
                undoneMoveStack = [];
                moveStack = value.history({verbose: true});
                return value;
            });
        },
        loadFirstMove: () => {
            update(value => {
                let move;
                while ((move = value.undo())) {
                    moveStack.pop();
                    undoneMoveStack.push(move);
                } 
                return value;
            });
        },
        loadPreviousMove: () => {
            update(value => {
                const move = value.undo({verbose: true});
                if (move) {
                    moveStack.pop();
                    undoneMoveStack.push(move);
                }
                return value;
            });
        },
        loadNextMove: () => {
            update(value => {           
                const move = undoneMoveStack.pop();
                if (move)  {
                    moveStack.push(move);
                    value.move(move);
                }
                // playMoveSound(chess.move(move));
                return value;
            });
        },
        loadLastMove: () => {
            update(value => {
                let move;
                while ((move = undoneMoveStack.pop())) {
                    moveStack.push(move);
                    value.move(move);
                } 
                return value;
            });
        },
        getPreviousMove: (): Move | undefined => {
            return moveStack[moveStack.length-1];
        },
        getCurrentMoveHistory: () => {
            return moveStack;
        },
        getTotalMoveHistory: () => {
            return moveStack.concat(undoneMoveStack.slice().reverse());
        },
        move: (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b')   => {
            update(value => {
                try {
                    
                    // Move (throws exception if move is invalid)
                    value.move({from, to, promotion});

                } catch(error) {
                    console.error(error);
                }
                return value;
            });
        }
    }
}