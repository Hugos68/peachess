<script lang="ts">
	import { ProgressBar } from "@skeletonlabs/skeleton";
	import { BLACK, KING, type Chess } from "chess.js";
	import { onMount } from "svelte";
    import { tweened } from 'svelte/motion';
    import { cubicOut } from "svelte/easing";
	import { onDestroy } from "svelte";

    export let chess: Chess;
    export let orientation: 'w' | 'b'

    let stockfish: Worker | undefined;
    let currentDepth = 0;
    const currentEvaluation = tweened(0, {
        duration: 5000,
        easing: cubicOut
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

    let debounceTimer: any;
    $: if (stockfish) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (!stockfish) return;
            stockfish.postMessage('stop');
            stockfish.postMessage('position fen '+chess.fen());
            stockfish.postMessage('go depth 25');
        }, 500);
    }
    onDestroy(() => {
        if (stockfish) stockfish.terminate();
    });
</script>

<p>Evalutation: {Math.round($currentEvaluation * 10) / 10} Depth {currentDepth}</p>
<ProgressBar class="{orientation===BLACK ? "rotate-180" : ""}" meter="bg-white" track="bg-black"  height="h-8" label="Evaluation bar" max={100} 
value={$currentEvaluation}/>
