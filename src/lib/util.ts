import { SQUARES, WHITE, BLACK } from "chess.js";
import { Howl } from 'howler';


export const antiAuthNavItems = [
    { label: 'Sign In', href: '/sign-in' },
    { label: 'Sign Up', href: '/sign-up' }
]
export const authNavItems = [
    { label: 'Home', href: '/home' },
    { label: 'Games', href: '/games' },
    { label: 'Puzzles', href: '/puzzles' },
    { label: 'Social', href: '/social' }
]


export const moveSFX = new Howl({
    src: '/sfx/move.mp3'
});
export const captureSFX = new Howl({
    src: '/sfx/capture.mp3'
});
export const gameOverSFX = new Howl({
    src: '/sfx/gameover.mp3'
});
export const errorSFX = new Howl({
    src: '/sfx/error.mp3'
});

export const playMoveSound = (move: Move): void => {

    // '#' is when a piece checkmates the opponents king
    if (move.san.includes('#')) gameOverSFX.play();

    // 'c' is when a piece captures
    else if (move.flags.includes('c')) captureSFX.play();

    // If game is not over and not capture, play move sound
    else moveSFX.play();
}

export function getAIEloByAIName(name: 'walter' | 'hank' | 'jesse'): number {
    switch (name) {
        case 'walter':
            return 3000;
            break;
        case 'hank':
            return 2000;
            break;
        case 'jesse':
            return 1000;
            break;
    }
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

export const getConfig = (chess: Chess, playingColor: 'w' | 'b' | undefined, moveStack: Move[], undoneMoveStack: Move[]) => {
    const canMove = playingColor && undoneMoveStack.length===0 && !chess.isGameOver();
    return {
        fen: chess.fen(),
        turnColor: chess.turn() === WHITE ? 'white' : 'black',
        orientation: playingColor===BLACK ? 'black' : 'white',
        lastMove: getLastMoveHighlight(moveStack),
        check: chess.inCheck(),
        movable: {
            free: false,
            dests: getValidMoves(chess),
            showDests: true,
            color: canMove ? (playingColor === WHITE ? 'white' : 'black') : undefined
        },
        drawable: {
            enabled: true,
            eraseOnClick: true
        }
    }
}

export function wasmThreadsSupported() {
    // WebAssembly 1.0
    const source = Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);
    if (
      typeof WebAssembly !== "object" ||
      typeof WebAssembly.validate !== "function"
    )
      return false;
    if (!WebAssembly.validate(source)) return false;
  
    // SharedArrayBuffer
    if (typeof SharedArrayBuffer !== "function") return false;
  
    // Atomics
    if (typeof Atomics !== "object") return false;
  
    // Shared memory
    const mem = new WebAssembly.Memory({ shared: true, initial: 8, maximum: 16 });
    if (!(mem.buffer instanceof SharedArrayBuffer)) return false;
  
    // Structured cloning
    try {
      // You have to make sure nobody cares about these messages!
      window.postMessage(mem, "*");
    } catch (e) {
      return false;
    }
  
    // Growable shared memory (optional)
    try {
      mem.grow(8);
    } catch (e) {
      return false;
    }
  
    return true;
  }
