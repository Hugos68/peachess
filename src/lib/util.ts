import { SQUARES } from "chess.js";

export function getPieceWeight(piece: 'k' | 'q' | 'r' | 'n' | 'b' | 'p'): number {
    switch (piece) {
        case 'k':
            return 4;
            break;
        case 'q':
            return 9;
            break;
        case 'r':
            return 4;
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

export function getCapturedPieces(moves: Move[]): CapturedPieces {
    const capturedPieces: CapturedPieces = {
        w: { k: 0, q: 0, r: 0, n: 0, b: 0, p: 0 },
        b: { k: 0, q: 0, r: 0, n: 0, b: 0, p: 0 },
    }
    for (const move of moves) {
        if (move.captured) capturedPieces[move.color][move.captured]++;
    }
    return capturedPieces;
}

export function getValidMoves(chess: Chess): Map<Square, Square> {
    const dests = new Map();
    SQUARES.forEach(square => {
        const moves = chess.moves({square: square, verbose: true});
        dests.set(square, moves.map(move => move.to));
    });
    return dests;
}