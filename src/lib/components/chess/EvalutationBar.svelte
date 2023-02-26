<script lang="ts">
	import { ProgressBar } from "@skeletonlabs/skeleton";
	import { BLACK, type Chess } from "chess.js";
	import { onMount } from "svelte";
    import { tweened } from 'svelte/motion';
    import { cubicInOut } from "svelte/easing";
	import { onDestroy } from "svelte";

    export let chess: Chess;
    export let orientation: 'w' | 'b'

    let stockfish: Worker | undefined;
    let currentDepth = 0;
    const currentEvaluation = tweened(0, {
        duration: 1500,
        easing: cubicInOut
    });
    onMount(() => {
        if (!window.Worker) return;
        stockfish = new Worker('/stockfish/src/stockfish.js');
        stockfish.postMessage('ucinewgame');
        stockfish.onmessage = function(e) {
            if (!e.data.includes('info depth')) return;
            try {
                const depth = e.data.split('depth')[1].split(' ')[1];
                const score = Number(e.data.split('cp')[1].split(' ')[1]);
                if (score >= 100 || score <= 0) return;
                currentDepth = depth;
                currentEvaluation.set(score);                
            } catch {}
        }
    });

    $: if (stockfish) {
        stockfish.postMessage('ucinewgame');
        stockfish.postMessage('position fen '+chess.fen());
        stockfish.postMessage('go infinite 250');
    }
    onDestroy(() => {
        if (stockfish) stockfish.terminate();
    });
</script>

<p>Evalutation: {Math.round($currentEvaluation * 10) / 10} Depth {currentDepth}</p>
<ProgressBar class="{orientation===BLACK ? "rotate-180" : ""}" meter="bg-white" track="bg-black"  height="h-8" label="Evaluation bar" max={100} 
value={$currentEvaluation}/>
