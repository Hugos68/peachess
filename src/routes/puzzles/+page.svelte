<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import { getConfig, playMoveSound } from "$lib/util";
	import { Chess, type Move } from "chess.js";
    import type { PageData } from "./$types";

    export let data: PageData

    let lastCorrectFen: string, correctMoveIndex: number = 0, chess: Chess, moves: Move[], config: object, puzzleCompleted: boolean;
    function loadNewPuzzle(chessPuzzle: ChessPuzzle) {
        
        // Set the completed boolean to false
        puzzleCompleted = false;

        // Init chess object
        chess = new Chess(data.chessPuzzle.fen);  

        // Mark current fen as currently correct fen
        lastCorrectFen = chessPuzzle.fen;

        // Convert string of moves to filled array
        moves = [];
        chessPuzzle.moves.split(' ').forEach(move => {
            moves.push(chess.move(move));
        });

        // Load back the fen since the chess object is at the last move
        chess.load(data.chessPuzzle.fen);

        // Set correct move index to 0 since the first correct move is the first one in the list
        correctMoveIndex = 0;
        
        // Load the config for the board
        config = getConfig(chess, chess.turn() === 'w' ? 'b' : 'w', [], []);

        // Do enemy move after 1 second
        setTimeout(() => {
            doOpponentMove();
        }, 1000);
    }

    function doOpponentMove()  {
        const move = chess.move(moves[correctMoveIndex]);
        playMoveSound(move);
        config = getConfig(chess, moves[1].color, [moves[correctMoveIndex]], []);
        lastCorrectFen = chess.fen();
        correctMoveIndex++
        chess = chess;
    }

    function showNextMove()  {
        const move = chess.move(moves[correctMoveIndex]);
        playMoveSound(move);
        config = getConfig(chess, moves[1].color, [moves[correctMoveIndex]], []);
        lastCorrectFen = chess.fen();
        correctMoveIndex++
        chess = chess;

        if (!moves[correctMoveIndex]) puzzleCompleted = true;

        // Do enemy move after 1 second
        setTimeout(() => {
            doOpponentMove();
        }, 1000);
    }

    loadNewPuzzle(data.chessPuzzle);

    const moveCallBack = (event) => {
        const from = event.detail.from;
        const to = event.detail.to;
        const promotion = event.detail.promotion;
           
        let moveCorrect = false;
        try {
            const move = chess.move({
                from,
                to,
                promotion
            });
            playMoveSound(move);
            const correctMove = moves[correctMoveIndex];
            if (move.from === correctMove.from && move.to === correctMove.to) moveCorrect = true;
            
        } catch (error) {
            moveCorrect = false;
        }
        if (moveCorrect)  {
            correctMoveIndex++;
            lastCorrectFen = chess.fen();
            config = getConfig(chess, moves[1].color, [moves[correctMoveIndex-1]], []);
            if (!moves[correctMoveIndex]) puzzleCompleted = true;
            else {
                // Do enemy move after 1 second
                setTimeout(() => {
                    doOpponentMove();
                }, 1000);
            }
        }
        else {
            setTimeout(() => {
                chess.load(lastCorrectFen);
                config = getConfig(chess, moves[1].color, [moves[correctMoveIndex-1]], []);
                chess = chess;
            }, 250);
        } 
    }
 
</script>

 <div class="mx-auto xl:h-[calc(100vh-2rem)] flex flex-col xl:flex-row justify-center items-center gap-12">    
    <div class="overflow-hidden h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
        <ChessBoard config={config} on:move={moveCallBack}/>
    </div>
    <div class=" overflow-hidden card h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))] hidden xl:flex items-center justify-center">
        {#if puzzleCompleted}  
            <div class="flex flex-col justify-center items-center gap-4">
                <p>Puzzle completed, nice job!</p>
                <button class="btn variant-filled-primary" on:click={async () => {
                    await invalidateAll();
                    loadNewPuzzle(data.chessPuzzle);
                }}>Next Puzzle</button>
            </div>
        {:else}
            <div class="flex flex-col justify-center items-center gap-4">
                {#key chess}  
                    <p>{chess.turn()==='w' ? "White" : "Black"} to move</p>
                {/key}
                <button class="btn variant-filled-primary" on:click={showNextMove}>Show Next Move</button>
            </div>
        {/if}
    </div>
</div>
