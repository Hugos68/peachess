import {}

export const createGameStore = (chessGame: ChessGame) => {

    const chess: Chess = new Chess();
    chess.loadPgn(chessGame.pgn);
    const { set, update, subscribe } = Writable(chess);
    
    const undoneMoveStack: Move = [];

    return {
        set,
        update,
        subscribe,
        loadFirstMove: () => {
            console.log('not implemented');
            
        },
        loadPreviousMove: () => {
            console.log('not implemented');
        },
        loadNextMove: () => {
            console.log('not implemented');
        },
        loadLastMove: () => {
            console.log('not implemented');
        },
        move: (from: Square, to: Square, promotion?: 'q' | 'r' | 'n' | 'b')   => {
            update(chess => {
                try {
                    // Move (throws exception if move is invalid)
                    const move = chess.move({from, to, promotion});
                    playMoveSound(move);
                    
                } catch(error) {
                    console.error(error);
                }


                
                return chess;
            });

        }
    }
}