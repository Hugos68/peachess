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

    let stockfish: Worker | undefined;
    let currentDepth = 0;
    let currentEvaluation = tweened(0, {
		duration: 4000,
        easing: cubicInOut
	});
    
    let ready = false;
    onMount(() => {
        if (!window.Worker) return;

        const wasmSupported = typeof WebAssembly === 'object' && WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00));
        stockfish = new Worker(wasmSupported ? '/stockfish/stockfish.wasm.js' : '/stockfish/stockfish.js');
        stockfish.onmessage = function(e) {  
            if (e.data === 'readyok') ready = true;
            if (e.data.includes('best move')) stockfish?.postMessage('stop');
            if (!e.data.includes('info depth')) return;
            currentDepth = e.data.split('depth')[1].split(' ')[1];
            let cp;
            if (e.data.includes('mate')) chess.turn()==='w' ? cp = -20000 : cp = 20000;
            else cp = Number(e.data.split('cp')[1].split(' ')[1]);
            currentEvaluation.set(cpWinningChances(chess.turn()==='w' ? cp : cp * -1) * 100);
        }
        stockfish.postMessage("uci");
        stockfish.postMessage('isready');
    });
    let debounceTimeout: ReturnType<typeof setTimeout>;
    $: if (stockfish && ready) {
        stockfish.postMessage('stop');
        if (chess.fen()==='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1') {
            currentDepth = 0;
            currentEvaluation.set(0);
        }
        else {
            // Debounce mechanism to make sure stockfish only evaluates positions that are looked at by the end user
            if (debounceTimeout) clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                stockfish?.postMessage('ucinewgame');
                stockfish?.postMessage('position fen '+chess.fen());
                stockfish?.postMessage('go infinite');
            }, 50);
        }
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

<svelte:head>
    <script src="/stockfishwasm/stockfish.js"></script>
</svelte:head>

<ProgressBar track="bg-black" height="h-8" label="Evaluation bar" min={0} max={200} value={$currentEvaluation + 100} />

