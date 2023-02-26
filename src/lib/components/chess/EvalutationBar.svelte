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

    let ready = false;
    onMount(() => {
        if (!window.Worker) return;
        stockfish = new Worker('/stockfish/src/stockfish.js');
        stockfish.postMessage("uci");
        stockfish.postMessage('isready');
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

    $: if (stockfish && ready) {
        if (chess.fen()==='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            currentDepth = 0;
            currentEvaluation = 0;
        }
        else {
            stockfish.postMessage('stop');
            stockfish.postMessage('ucinewgame');
            stockfish.postMessage('position fen '+chess.fen());
            stockfish.postMessage('go infinite');
        }
    }
    onDestroy(() => {
        if (stockfish) stockfish.terminate();
    });
</script>


<p>{chess.turn()} : {currentEvaluation}</p>

