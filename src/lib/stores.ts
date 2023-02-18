import { Chess, type Move, type Square } from "chess.js";
import { writable, type Writable, get } from "svelte/store";
import { localStorageStore } from "@skeletonlabs/skeleton";
import { Howl } from 'howler';

export const settings: Writable<Settings> = localStorageStore('settings',  {
    animate: true,
    sfx: true,
    premove: false,
    drag: true
});

export function createChessGameStore() {
    return chessGameStore();
}

const moveSFX = new Howl({
    src: '/sfx/move.mp3'
});
const captureSFX = new Howl({
    src: '/sfx/capture.mp3'
});
const castleSFX = new Howl({
    src: '/sfx/castle.mp3'
});
const checkSFX = new Howl({
    src: '/sfx/check.mp3'
});
const gameOverSFX = new Howl({
    src: '/sfx/gameover.mp3'
});

const playMoveSound = (move: Move) => {
    if (!get(settings).sfx) return;
   
    // '#' is when a piece checkmates the opponents king
    else if (move.san.includes('#')) gameOverSFX.play();

    // '+' is when a piece checks the opponents king
    else if (move.san.includes('+')) checkSFX.play();

    // 'k' is when castling kingside, 'q' is when castling queenside
    else if (move.flags.includes('k') || move.flags.includes('q')) castleSFX.play();

    // 'c' is when a piece captures
    else if (move.flags.includes('c')) captureSFX.play();

    // 'n' is when a piece moves, 'b' is when a pawn moves 2 squares
    else if (move.flags.includes('n') || move.flags.includes('b')) moveSFX.play();
}

const chessGameStore = () => {

    const chess: Chess = new Chess();
    const { set, update, subscribe } = writable(chess);
    
    let undoneMoveStack: Move[] = [];
    let moveStack: Move[] = [];
    let chessGame: ChessGame;

    return {
        set,
        update,
        subscribe,
        loadGame: (toBeLoadedChessGame: chessGame) => {
            update(chess => {

                chessGame = toBeLoadedChessGame;
                chess.loadPgn(chessGame.pgn)

                const moveAmountBeforeUpdating = moveStack.length + undoneMoveStack.length;

                undoneMoveStack = [];
                moveStack = chess.history({verbose: true});

                const moveAmountAfterUpdating = moveStack.length + undoneMoveStack.length;
                
                if (moveAmountBeforeUpdating !== moveAmountAfterUpdating) playMoveSound(moveStack[moveStack.length-1]);

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
            update(chess => {
                const move = chess.undo({verbose: true});
                if (move) {
                    moveStack.pop();
                    undoneMoveStack.push(move);
                }
                return chess;
            });
        },
        loadNextMove: () => {
            update(chess => {          
                const move = undoneMoveStack.pop();
                if (move)  {
                    playMoveSound(move);
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
        getCurrentMoveHistory: (): Move[] => {
            return moveStack;
        },
        getTotalMoveHistory: (): Move[] => {
            return moveStack.concat(undoneMoveStack.slice().reverse());
        },
        getChessGame: (): ChessGame => {
            return chessGame;
        },
        move: (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b')   => {
            let move;
            update(chess => {
                try {

                    // Move (throws exception if move is invalid)
                    move = chess.move({from, to, promotion});
                    moveStack.push(move);
                    playMoveSound(move);

                } catch(error) {
                    console.error(error);
                }
                return chess;
            });
            return move;
        }
    }
}