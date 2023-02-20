import { Chess, type Move, type Square } from "chess.js";
import { writable, type Writable, get } from "svelte/store";
import { Howl } from 'howler';
import { getMaterial, updateMaterial } from "$lib/util";
import { settings} from './settings-store';

export function createChessStateStore(chessGame: ChessGame): ChessStateStore {

    // Init chessState by loading pgn into chess and loading history into the move stack
    const chess = new Chess();
    chess.loadPgn(chessGame.pgn);
    const moveStack: Move[] = chess.history({verbose: true});
    const undoneMoveStack: Move[] = [];
    const material = getMaterial(moveStack);

    const chessState: ChessState = {
        chessGame,
        chess,
        moveStack,
        undoneMoveStack,
        material
    }
    return chessStateStore(chessState);
}

const chessStateStore: ChessStateStore = (chessState: ChessState) => {

    const { set, update, subscribe }: Writable<ChessState> = writable(chessState);

    return {
        set,
        update,
        subscribe,
        loadGame: (toBeLoadedChessGame: chessGame) => {
            update(chessState => {

                chessState.chessGame = toBeLoadedChessGame;
                chessState.chess.loadPgn(chessState.chessGame.pgn)

                const moveAmountBeforeUpdating = chessState.moveStack.length + chessState.undoneMoveStack.length;

                chessState.undoneMoveStack = [];
                chessState.moveStack = chessState.chess.history({verbose: true});
                chessState.material = getMaterial(chessState.moveStack);    

                const moveAmountAfterUpdating = chessState.moveStack.length + chessState.undoneMoveStack.length;
                
                if (moveAmountBeforeUpdating < moveAmountAfterUpdating) playMoveSound(chessState.moveStack[chessState.moveStack.length-1]);

                return chessState;
            });
        },
        loadFirstMove: () => {
            update(chessState => {
                let move;
                while ((move = chessState.chess.undo({verbose: true}))) {
                    chessState.moveStack.pop();
                    chessState.undoneMoveStack.push(move);
                }
                chessState.material = getMaterial(chessState.moveStack);
                return chessState;
            });
        },
        loadPreviousMove: () => {
            const move = chessState.chess.undo({verbose: true});
            if (!move) return;
            update(chessState => {
                chessState.moveStack.pop();
                chessState.undoneMoveStack.push(move);
                chessState.material = updateMaterial(chessState.material, move);
                return chessState;
            });
        },
        loadNextMove: () => {
            const move = chessState.undoneMoveStack.pop();
            if (!move) return;
            playMoveSound(move);
            update(chessState => {          
                chessState.moveStack.push(move);
                chessState.chess.move(move);
                chessState.material = updateMaterial(chessState.material, move);
                return chessState;
            });
        },
        loadLastMove: () => {
            update(chessState => {
                let move;
                while ((move = chessState.undoneMoveStack.pop())) {
                    chessState.moveStack.push(move);
                    chessState.chess.move(move);
                } 
                chessState.material = getMaterial(chessState.moveStack);
                return chessState;
            });
        },
        move: (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b')   => {
            let move;
            update(chessState => {
                try {

                    // Move (throws exception if move is invalid)
                    move = chessState.chess.move({from, to, promotion});
                    chessState.moveStack.push(move);
                    chessState.material = getMaterial(chessState.moveStack);
                    playMoveSound(move);

                } catch(error) {
                    console.error(error);
                }
                return chessState;
            });
            return move;
        }
    }
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

const playMoveSound = (move: Move): void => {
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

export interface ChessStateStore extends Writable<ChessState> {
    loadGame: (chessGame: ChessGame) => void
    loadFirstMove: () => void
    loadPreviousMove: () => void
    loadNextMove: () => void
    loadLastMove: () => void
    move: (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b') => Move
}