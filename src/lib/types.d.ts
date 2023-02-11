interface ChessGame {
    id: number
    created_at: string
    player_id_white: string
    player_id_black: string
    history: [
        {
            to: string
            from: string
            fen: string
        }
    ]
}