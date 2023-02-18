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
            update(chess => {
                chess.loadPgn(chessGame.pgn)
                undoneMoveStack = [];
                moveStack = value.history({verbose: true});
                return chess;
            });
        },
        loadFirstMove: () => {
            update(chess => {
                let move;
                while ((move = chess.undo())) {
                    moveStack.pop();
                    undoneMoveStack.push(move);
                } 
                return chess;
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
            update(chess => {           
                const move = undoneMoveStack.pop();
                if (move)  {
                    moveStack.push(move);
                    chess.move(move);
                }
                return chess;
            });
        },
        loadLastMove: () => {
            update(chess => {
                let move;
                while ((move = undoneMoveStack.pop())) {
                    moveStack.push(move);
                    chess.move(move);
                } 
                return chess;
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
            update(chess => {
                try {

                    // Move (throws exception if move is invalid)
                    chess.move({from, to, promotion});

                } catch(error) {
                    console.error(error);
                }
                return chess;
            });
        }
    }
}