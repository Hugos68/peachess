import { SQUARES, WHITE, BLACK } from "chess.js";
import { Howl } from 'howler';

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

export const playMoveSound = (move: Move): void => {

    // '#' is when a piece checkmates the opponents king
    if (move.san.includes('#')) gameOverSFX.play();

    // '+' is when a piece checks the opponents king
    else if (move.san.includes('+')) checkSFX.play();

    // 'k' is when castling kingside, 'q' is when castling queenside
    else if (move.flags.includes('k') || move.flags.includes('q')) castleSFX.play();

    // 'c' is when a piece captures
    else if (move.flags.includes('c')) captureSFX.play();

    // 'n' is when a piece moves, 'b' is when a pawn moves 2 squares
    else if (move.flags.includes('n') || move.flags.includes('b')) moveSFX.play();
}


export function getPieceWeight(piece: 'k' | 'q' | 'r' | 'n' | 'b' | 'p'): number {
    switch (piece) {
        case 'k':
            return 4;
            break;
        case 'q':
            return 9;
            break;
        case 'r':
            return 5;
            break;
        case 'n':
            return 3;
            break;
        case 'b':
            return 3;
            break;
        case 'p':
            return 1;
            break;
    }
}

export function getPieceName(piece: 'k' | 'q' | 'r' | 'n' | 'b' | 'p'): string {
    switch (piece) {
        case 'k':
            return 'king';
            break;
        case 'q':
            return 'queen';
            break;
        case 'r':
            return 'rook';
            break;
        case 'n':
            return 'knight';
            break;
        case 'b':
            return 'bishop';
            break;
        case 'p':
            return 'pawn';
            break;
    }
}

export function getMaterial(moves: Move[]): Material {
    const material: Material = {
        w: {
            captures: {
                k: 0,
                q: 0,
                r: 0,
                n: 0,
                b: 0,
                p: 0
            },
            total: 0
        },
        b: {
            captures: {
                k: 0,
                q: 0,
                r: 0,
                n: 0,
                b: 0,
                p: 0
            },
            total: 0
        }
    }
    for (const move of moves) {
        if (!move.captured) continue;
        material[move.color].captures[move.captured]++;
        material[move.color].total+=getPieceWeight(move.captured);
    }
    return material;
}

export function updateMaterial(material: Material, move: Move, method: 'add' | 'subtract') {
    if (!move.captured) return material;
    if (method==='add') {
        material[move.color].captures[move.captured]++;
        material[move.color].total+=getPieceWeight(move.captured);
    }
    else {
        material[move.color].captures[move.captured]--;
        material[move.color].total-=getPieceWeight(move.captured);
    }

    return material;
}

export function getValidMoves(chess: Chess): Map<Square, Square> {
    const dests = new Map();
    SQUARES.forEach(square => {
        const moves = chess.moves({square: square, verbose: true});
        dests.set(square, moves.map(move => move.to));
    });
    return dests;
}

export function getOrientation(chessGame: OnlineChessGame, session: Session) {
    const playingColor = getPlayingColor(chessGame, session);

    // Default to white (for spectators)
    return playingColor || 'w';
}

export function getPlayingColor(chessGame: OnlineChessGame, session: Session | undefined) {
    if (!session) return;
    return session.user.id === chessGame.player_id_white ? 'w' : 'b';
}


export const getLastMoveHighlight = (moves: Move[]) => {
    const move = moves[moves.length-1]; 
    if (!move) return [];
    return [move.from, move.to];
}

export function getViewOnly(chessGame: OnlineChessGame, chess: Chess, undoneMoveStack: Move[], session: Session | undefined) {

    // If someone is not logged in they cannot make moves
    if (!session) return true;

    // If someone is not part of the game they cannot make moves
    if (session.user.id !== chessGame.player_id_white && session.user.id !== chessGame.player_id_black) return true;

    // If someone is part of the game but they aren't looking at the latest turn they cannot make moves
    if (undoneMoveStack.length!==0) return true;

    // If the game is over they cannot make moves
    if (chess.isGameOver()) return true;
    return false;
}

export const getConfig = (chess: Chess, playingColor: 'w' | 'b' | undefined, moveStack: Move[], undoneMoveStack: Move[]) => {
    const viewOnly = playingColor === undefined || undoneMoveStack.length!==0;
    return {
        fen: chess.fen(),
        turnColor: chess.turn() === WHITE ? 'white' : 'black',
        viewOnly: viewOnly,
        lastMove: getLastMoveHighlight(moveStack),
        check: chess.inCheck(),
        movable: {
            free: false,
            dests: getValidMoves(chess),
            showDests: true,
        },
        drawable: {
            enabled: true,
            eraseOnClick: true
        },

    }
}
