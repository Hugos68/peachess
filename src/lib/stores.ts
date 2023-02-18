import { Chess, type Move, type Square } from "chess.js";
import { writable } from "svelte/store";


export const createChessGameStore = (chessGame: ChessGame) => { return chessGameStore(chessGame) }

const chessGameStore = (chessGame: ChessGame) => {

    const chess: Chess = new Chess();
    chess.loadPgn(chessGame.pgn);
    const { set, update, subscribe } = writable(chess);
    
    const undoneMoveStack: Move[] = [];

    return {
        set,
        update,
        subscribe,
        loadFirstMove: () => {
            update(chess => {
                let move;
                while ((move = chess.undo())) undoneMoveStack.push(move);
                return chess;
            });
        },
        loadPreviousMove: () => {
            update(chess => {
                const move = chess.undo();
                if (move) undoneMoveStack.push(move);
                return chess;
            });
        },
        loadNextMove: () => {
            update(chess => {
                const move = undoneMoveStack.pop();
                if (!move) return;
                // playMoveSound(chess.move(move));
                return chess;
            });
        },
        loadLastMove: () => {
            update(chess => {
                let move;
                while ((move = undoneMoveStack.pop())) chess.move(move);
                return chess;
            });
        },
        move: (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b')   => {
            update(chess => {
                try {

                    // Move (throws exception if move is invalid)
                    const move = chess.move({from, to, promotion});
                    // playMoveSound(move);
                } catch(error) {
                    console.error(error);
                }
                return chess;
            });

        }
    }
}