<script lang="ts">
	import { ProgressBar } from "@skeletonlabs/skeleton";
	import { BLACK, WHITE, type Chess } from "chess.js";
	import { onMount } from "svelte";
    import { tweened } from 'svelte/motion';
    import { cubicInOut } from "svelte/easing";
	import { onDestroy } from "svelte";

    export let chess: Chess;
    export let orientation: 'w' | 'b'

    let stockfish: Worker | undefined;
    let currentDepth = 0;
    let currentEvaluation = 0;
    onMount(() => {
        if (!window.Worker) return;
        stockfish = new Worker('/stockfish/src/stockfish.js');
        stockfish.postMessage("uci");
        stockfish.postMessage('ucinewgame');
        stockfish.onmessage = function(e) {      
            console.log(e.data);
            
            if (!e.data.includes('info depth')) return;
            try {
                currentDepth = e.data.split('depth')[1].split(' ')[1];
                if (currentDepth < 15) return;
                const score = Number(e.data.split('cp')[1].split(' ')[1]);
                currentEvaluation = score;
                if (chess.turn()===BLACK) 
            } catch {}
        }
    });

    $: if (stockfish) {
        if (chess.fen()==='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            currentDepth = 0;
            currentEvaluation = 0;
        }
        else {
            stockfish.postMessage('ucinewgame');
            stockfish.postMessage('position fen '+chess.fen());
            stockfish.postMessage('go movetime 3000')
        }
    }
    onDestroy(() => {
        if (stockfish) stockfish.terminate();
    });
</script>


<p>{chess.turn()} : {currentEvaluation}</p>

