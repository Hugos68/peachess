import { Chess, type Move, type Square } from "chess.js";
import { writable, type Writable, get } from "svelte/store";
import { getConfig, getMaterial, updateMaterial, playMoveSound, gameOverSFX } from "$lib/util";
import { settings} from './settings-store';

export function createPuzzleChessStateStore(chessPuzzle: ChessPuzzle): AIChessStateStore {
    
    // Init chess object
    const chess = new Chess(chessPuzzle.fen);

    // Convert string of moves to filled array
    const movesInOrder: Move[] = [];
    chessPuzzle.moves.split(' ').forEach(move => {
        movesInOrder.push(chess.move(move));
    });

    // Load back the fen since the chess object is at the last move
    chess.load(chessPuzzle.fen);

    // Playing color will always be the second move's color since the first move is to showcase the last done move
    const playingColor = movesInOrder[1].color;
    
    const currentMoveIndex = 0;

    // Add the first move done by the enemy to the history
    const moveStack = [];
    const undoneMoveStack = [];

    const material = getMaterial(moveStack);
    const boardConfig = getConfig(chess, playingColor, moveStack, undoneMoveStack);

    const puzzleCompleted = false;

    chess.header('Event', 'Chess Puzzle');
    chess.header('Site', 'https://peachess.vercel.app/');
    chess.header('Date', new Date());
    chess.header('Round', null);
    
    const puzzleChessState: PuzzleChessState = {
        chessPuzzle,
        playingColor,
        movesInOrder,
        puzzleCompleted,
        currentMoveIndex,
        chess,
        moveStack,
        undoneMoveStack,
        material,
        boardConfig
    }

    return puzzleChessStateStore(puzzleChessState);
}

const puzzleChessStateStore = (chessState: PuzzleChessState) => {

    const { set, update, subscribe }: Writable<PuzzleChessState> = writable<PuzzleChessState>(chessState);

    setTimeout(() => {
        update(chessState => {
            const move = chessState.chess.move(chessState.movesInOrder[chessState.currentMoveIndex]);
            if (get(settings).sfx) playMoveSound(move);
            chessState.currentMoveIndex++;
            chessState.lastCorrectFen = chessState.chess.fen();
            chessState.moveStack.push(move);
            chessState.material = getMaterial(chessState.moveStack);
            chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
            return chessState;
        });
    }, 1000);

    return {
        set,
        update,
        subscribe,
        loadFirstMove: () => {
            update(chessState => {
                if (chessState.moveStack.length===0) return chessState;
                const headers = chessState.chess.header();
                chessState.chess.load(chessState.chessPuzzle.fen);
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
                if (chessState.moveStack.length===0) return chessState;
                const move = chessState.moveStack.pop();
                if (!move) return chessState;
                chessState.chess.undo();
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
                let poppedMove;
                while ((poppedMove = chessState.undoneMoveStack.pop())) {
                    chessState.chess.move(poppedMove);
                    chessState.moveStack.push(poppedMove);
                }
                chessState.material = getMaterial(chessState.moveStack);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                return chessState;
            });
        },
        showNextMove: () => {
            update(chessState => {

                // Check if puzzle is done
                if (chessState.puzzleCompleted) return chessState;
                
                // Load last move in case of desync
                let poppedMove;
                while ((poppedMove = chessState.undoneMoveStack.pop())) {
                    chessState.chess.move(poppedMove);
                    chessState.moveStack.push(poppedMove);
                }

                // Move (throws exception if move is invalid)
                const move = chessState.chess.move(chessState.movesInOrder[chessState.currentMoveIndex]);
                if (get(settings).sfx) playMoveSound(move);

                chessState.currentMoveIndex++;
                chessState.lastCorrectFen = chessState.chess.fen();
                chessState.moveStack.push(move);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                
                setTimeout(() => {
                    update(chessState => {
                        if (chessState.puzzleCompleted) return chessState;

                        // Load last move in case of desync
                        let poppedMove;
                        while ((poppedMove = chessState.undoneMoveStack.pop())) {
                            chessState.chess.move(poppedMove);
                            chessState.moveStack.push(poppedMove);
                        }
                        const move = chessState.chess.move(chessState.movesInOrder[chessState.currentMoveIndex]);
                        if (get(settings).sfx) playMoveSound(move);
                        chessState.currentMoveIndex++;
                        chessState.moveStack.push(move);
                        chessState.material = getMaterial(chessState.moveStack);
                        chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                        return chessState;
                    });
                }, 1000);
                
                if (!chessState.movesInOrder[chessState.currentMoveIndex]) {
                    chessState.puzzleCompleted = true;
                    gameOverSFX.play();
                    return chessState;
                }
            
                return chessState;
            });
        },
        move: (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b'): boolean  => {
            let moveWasCorrect = false;
            update(chessState => {

                // Check if puzzle is done
                if (chessState.puzzleCompleted) return chessState;

                // Load last move in case of desync
                let poppedMove;
                while ((poppedMove = chessState.undoneMoveStack.pop())) {
                    chessState.chess.move(poppedMove);
                    chessState.moveStack.push(poppedMove);
                }
                
                // Move (throws exception if move is invalid)
                const move = chessState.chess.move({from, to, promotion});
                if (get(settings).sfx) playMoveSound(move);

                const desiredMove = chessState.movesInOrder[chessState.currentMoveIndex];

                // If the move done is not the one from the puzzle, undo it and return
                if (move.from !== desiredMove.from || move.to !== desiredMove.to) {
                    chessState.chess.undo();
                    return chessState;
                }
                else moveWasCorrect = true;
                
                chessState.currentMoveIndex++;
                chessState.lastCorrectFen = chessState.chess.fen();
                chessState.moveStack.push(move);
                chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);

                setTimeout(() => {
                    update(chessState => {
                        if (chessState.puzzleCompleted) return chessState;

                        // Load last move in case of desync
                        let poppedMove;
                        while ((poppedMove = chessState.undoneMoveStack.pop())) {
                            chessState.chess.move(poppedMove);
                            chessState.moveStack.push(poppedMove);
                        }

                        const move = chessState.chess.move(chessState.movesInOrder[chessState.currentMoveIndex]);
                        if (get(settings).sfx) playMoveSound(move);
                        chessState.currentMoveIndex++;
                        chessState.moveStack.push(move);
                        chessState.material = getMaterial(chessState.moveStack);
                        chessState.boardConfig = getConfig(chessState.chess, chessState.playingColor, chessState.moveStack, chessState.undoneMoveStack);
                        return chessState;
                    });
                }, 1000);

                if (!chessState.movesInOrder[chessState.currentMoveIndex]) {
                    chessState.puzzleCompleted = true;
                    gameOverSFX.play();
                    return chessState;
                }
                return chessState;
            });
            return moveWasCorrect;
        }
    }
}