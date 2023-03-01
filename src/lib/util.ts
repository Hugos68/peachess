import { SQUARES, WHITE } from "chess.js";
import { Howl } from 'howler';

export const moveSFX = new Howl({
    src: '/sfx/move.mp3'
});
export const captureSFX = new Howl({
    src: '/sfx/capture.mp3'
});
export const gameOverSFX = new Howl({
    src: '/sfx/gameover.mp3'
});

export const playMoveSound = (move: Move): void => {

    // '#' is when a piece checkmates the opponents king
    if (move.san.includes('#')) gameOverSFX.play();

    // 'c' is when a piece captures
    else if (move.flags.includes('c')) captureSFX.play();

    // If game is not over and not capture, play move sound
    else moveSFX.play();
}

export function getAINameByDifficulity(AIDifficulity: 0 | 1 | 2 | 3 | 4): string {
    switch (AIDifficulity) {
        case 0:
            return "george";
            break;
        case 1:
            return "bob";
            break;
        case 2:
            return "will";
            break;
        case 3:
            return "matt";
            break;
        case 4:
            return "peter";
            break;
    }
}

export function getAIDifficulityByName(name: 'george' | 'bob' | 'will' | 'matt' | 'peter'): number {
    switch (name) {
        case 'george':
            return 0;
            break;
        case 'bob':
            return 1;
            break;
        case 'will':
            return 2;
            break;
        case 'matt':
            return 3;
            break;
        case 'peter':
            return 4;
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
    const viewOnly = playingColor === undefined || undoneMoveStack.length!==0 || chess.isGameOver();
    return {
        fen: chess.fen(),
        turnColor: chess.turn() === WHITE ? 'white' : 'black',
        orientation: playingColor==='b' ? 'black' : 'white',
        lastMove: getLastMoveHighlight(moveStack),
        viewOnly: viewOnly,
        check: chess.inCheck(),
        movable: {
            free: false,
            dests: getValidMoves(chess),
            showDests: true,
            color: playingColor === WHITE ? 'white' : 'black',
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
