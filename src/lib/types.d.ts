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