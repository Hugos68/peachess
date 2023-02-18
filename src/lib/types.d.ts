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
    sfx: boolean
    premove: boolean
    drag: boolean
}

interface ChessInterface {
    chessGame: ChessGame,
    chess: Chess,
    moveStack: Move[],
    undoneMoveStack: Move[]
}