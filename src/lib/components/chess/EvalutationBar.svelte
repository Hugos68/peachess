<script lang="ts" type="module">
	import { wasmThreadsSupported } from "$lib/util";
	import { ProgressBar } from "@skeletonlabs/skeleton";
    import type { Chess } from "chess.js";
	import { onMount } from "svelte";
	import { onDestroy } from "svelte";
	import { cubicInOut } from "svelte/easing";
	import { tweened } from "svelte/motion";

    export let chess: Chess;
    export let orientation: 'w' | 'b'

    let turn: 'w' | 'b' = chess.turn();
    let stockfish: any | undefined;
    let currentDepth = 0;
    let currentEvaluation = tweened(0, {
		duration: 1000,
        easing: cubicInOut
	});
    
    onMount(async () => {
        if (!wasmThreadsSupported()) {
            console.log("Browser does not support wasm threads therefor stockfish can not be loaded");
            return;
        }

        stockfish = await Stockfish();
        stockfish.addMessageListener((line: string) => {            
            if (line.includes('depth')) {
                const depth = Number(line.split('depth')[1].split(' ')[1]);
                if (depth > currentDepth) currentDepth = depth;
            }
            if (line.includes('cp')) {
                const cp = Number(line.split('cp ')[1].split(' ')[0]);
                currentEvaluation.set(cpWinningChances(turn === 'w' ? cp : cp * -1) * 100);
            }
            if (line.includes('mate')) {
                const mateValue = Number(line.split('mate ')[1].split(' ')[0]);
                console.log(mateValue);
                if (turn === 'w') {
                    if (mateValue > 0) currentEvaluation.set(100);
                    else currentEvaluation.set(-100);
                } 
                else {
                    if (mateValue > 0) currentEvaluation.set(-100);
                    else currentEvaluation.set(100);
                }
            }
        });

        stockfish.postMessage('uci');
        stockfish.postMessage('isready');
        stockfish?.postMessage('ucinewgame');
        stockfish?.postMessage('position fen '+chess.fen());
        stockfish?.postMessage('go');
        
    });
    let debounceTimeout: ReturnType<typeof setTimeout>;


    $: if (stockfish) {
        stockfish.postMessage('stop');
        // Debounce mechanism to make sure stockfish only evaluates positions that are looked at by the user
        if (debounceTimeout) clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            turn = chess.turn();
            currentDepth = 0;
            currentEvaluation.set(0);
            stockfish?.postMessage('ucinewgame');
            stockfish?.postMessage('position fen '+chess.fen());
            stockfish?.postMessage('go');
        }, 250);
    }


    onDestroy(() => {
        if (stockfish) stockfish.terminate();
    });
    const rawWinningChances = (cp: number): number => {
        const MULTIPLIER = -0.00368208;
        return 2 / (1 + Math.exp(MULTIPLIER * cp)) - 1;
    };
    const cpWinningChances = (cp: number): number => rawWinningChances(Math.min(Math.max(-1000, cp), 1000));
</script>

<ProgressBar track="bg-black" height="h-8" label="Evaluation bar" min={0} max={200} value={$currentEvaluation + 100} />

