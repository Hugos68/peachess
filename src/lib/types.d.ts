interface ChessRecord {
    id: number
    created_at: string
    player_id_white: string
    player_id_black: string
    fen: string
    flipped: boolean
}

interface Tile {
    square: string
    type: string
    color: string
}
