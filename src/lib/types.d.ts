interface OnlineChessGame {
    id: number
    created_at: string
    player_id_white: string
    player_id_black: string
    pgn: string
}

interface ChessPuzzle {
    fen: string
    moves: string
    rating: number
    categories: string
}

interface AIChessGame {
    AIDifficulity: 0 | 1 | 2 | 3 | 4
    pgn?: string
}

interface CustomMove {
    from: string
    to: string
    promotion?: 'q' | 'r' | 'n' | 'b'
}

interface Settings {
    animate: boolean
    sfx: boolean
    premove: boolean
    drag: boolean
    lastMoveHighlight: boolean
    checkHighlight: boolean
}

interface ChessState {
    chess: Chess
    playingColor: 'w' | 'b'
    moveStack: Move[]
    undoneMoveStack: Move[]
    boardConfig: Config
    material: Material
}

interface OnlineChessState extends ChessState {
    chessGame: OnlineChessGame
}

interface AIChessState extends ChessState {
    pgn: string
    AIDifficulity: 0 | 1 | 2 | 3 | 4
}

interface PuzzleChessState extends ChessState {
    chessPuzzle: ChessPuzzle
    puzzleCompleted: boolean
    movesInOrder: Move[]
    currentMoveIndex: number
}

interface Material {
    w: {
        captures: {
            k: number,
            q: number,
            r: number,
            n: number,
            b: number,
            p: number
        }
        total: number
    },
    b: {
        captures: {
            k: number,
            q: number,
            r: number,
            n: number,
            b: number,
            p: number
        }
        total: number
    }
}
