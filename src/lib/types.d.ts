interface ChessGame {
    id: number
    created_at: string
    player_id_white: string
    player_id_black: string
    pgn: string
}

interface CustomMove {
    from: string
    to: string
    promotion?: 'q' | 'r' | 'n' | 'b'
}

interface Settings {
    animate: boolean
    animationDuration: number
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
    boardConfig: object
    material: Material
}

interface OnlineChessState extends ChessState {
    chessGame: ChessGame
}

interface AIChessState extends ChessState {
    pgn: string
    AIDifficulity: 0 | 1 | 2 | 3 | 4
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
