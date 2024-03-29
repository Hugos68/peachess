<script lang="ts">
	import ChessBoard from "$lib/components/chess/ChessBoard.svelte";
	import MoveControls from "$lib/components/chess/MoveControls.svelte";
    import ChessGamePanel from "$lib/components/chess/ChessGamePanel.svelte";
	import { createPuzzleChessStateStore } from "$lib/stores/puzzle-chess-store";
	import { modalStore, type ModalComponent, type ModalSettings } from "@skeletonlabs/skeleton";
	import { BLACK, WHITE } from "chess.js";
	import type { Writable } from "svelte/store";
    import type { PageData } from "./$types";
    import { supabase } from "$lib/supabase";
	import { scale } from "svelte/transition";

    export let data: PageData
    
    let chessStateStore: Writable<PuzzleChessState> = createPuzzleChessStateStore(data.chessPuzzle)

    let streak: number = 0;
    let mistakes: number = 0;
    let mistakeMade: boolean = false;
    
    async function loadNewPuzzle() {
        const { data } = await supabase.rpc('get_random_puzzle', {
            low_rating: 600 + 100 * streak > 2000 ? 2000 : 600 + 100 * streak,
            high_rating: 700 + 100 * streak
        });
        chessStateStore = createPuzzleChessStateStore(data);
    }

    const openGamePanel = () => {
        const modalComponent: ModalComponent = {
		    ref: ChessGamePanel,
            
            props: { 
                chessStateStore,
                width: "w-full",
                height: "h-[66vh]"
            },
        };
	    const modal: ModalSettings = {
            type: 'component',
            component: modalComponent,
        };
        modalStore.trigger(modal);
    }
</script>

<div class="mx-auto xl:h-[calc(100vh-6rem)] flex flex-col xl:flex-row justify-center items-center gap-12">

    <div class="flex flex-col gap-2">
        <header class="flex justify-between items-center">
            {#if mistakeMade}
                <p class="p-1.5 md:p-2 my-auto rounded-token font-semibold text-center variant-filled-error">Mistake</p>
            {:else if $chessStateStore.puzzleCompleted}
                <p class="p-1.5 md:p-2 my-auto rounded-token font-semibold text-center variant-filled-success">Puzzle Completed</p>
            {:else}
                {@const turn = $chessStateStore.chess.turn()}
                <p
                class="my-auto p-1.5 md:p-2 rounded-token font-semibold text-center"
                class:text-white={turn===BLACK}
                class:text-black={turn===WHITE}
                class:bg-white={turn===WHITE} 
                class:bg-black={turn===BLACK}
                >{turn===WHITE ? 'White' : 'Black'}'s turn</p>
            {/if}
            <div class="flex gap-2">
                <p class="variant-filled-secondary p-1.5 md:p-2 rounded-token font-semibold">Rating: {$chessStateStore.chessPuzzle.rating} </p>
                <p class="variant-filled-secondary p-1.5 md:p-2 rounded-token font-semibold">Streak: {streak}</p>
            </div>
        </header>

        <div class="overflow-hidden card h-[min(calc(100vw)-1rem,calc(95vh-12rem))] w-[min(calc(100vw)-1rem,calc(95vh-12rem))]">
            <ChessBoard config={$chessStateStore.boardConfig} on:move={(event) => {
                const moveWasCorrect = chessStateStore.move(event.detail.from, event.detail.to, event.detail?.promotion);
                if (!moveWasCorrect) {
                    mistakes++;
                    mistakeMade = true;
                    setTimeout(() =>  {
                        loadNewPuzzle();
                        setTimeout(() => {
                            if (mistakes >= 3) {
                            streak = 0;
                            mistakes = 0;
                            }
                            mistakeMade = false;
                        }, 250);
                        // Reset streak and mistake of 3 or more mistakes were made
       
                    }, 500);
                }
                else if ($chessStateStore.puzzleCompleted) {
                    streak++;
                    setTimeout(() =>  {
                        loadNewPuzzle();
                    }, 500);
                }
            }}/>
        </div>
    
        <footer class="flex justify-between items-center">
            <MoveControls {chessStateStore} />
            <div class="flex gap-1">
                <div class="card !bg-error-500 w-[2.75rem] aspect-square">
                    {#if mistakes > 0}
                        <svg class="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" in:scale>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.46967 5.46967C5.76256 5.17678 6.23744 5.17678 6.53033 5.46967L18.5303 17.4697C18.8232 17.7626 18.8232 18.2374 18.5303 18.5303C18.2374 18.8232 17.7626 18.8232 17.4697 18.5303L5.46967 6.53033C5.17678 6.23744 5.17678 5.76256 5.46967 5.46967Z" fill="#000000"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5303 5.46967C18.8232 5.76256 18.8232 6.23744 18.5303 6.53033L6.53035 18.5303C6.23745 18.8232 5.76258 18.8232 5.46969 18.5303C5.17679 18.2374 5.17679 17.7626 5.46968 17.4697L17.4697 5.46967C17.7626 5.17678 18.2374 5.17678 18.5303 5.46967Z" fill="#000000"/>
                        </svg>
                    {/if}
                </div>
                <div class="card !bg-error-500 w-[2.75rem] aspect-square">
                    {#if mistakes > 1}
                        <svg class="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" in:scale>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.46967 5.46967C5.76256 5.17678 6.23744 5.17678 6.53033 5.46967L18.5303 17.4697C18.8232 17.7626 18.8232 18.2374 18.5303 18.5303C18.2374 18.8232 17.7626 18.8232 17.4697 18.5303L5.46967 6.53033C5.17678 6.23744 5.17678 5.76256 5.46967 5.46967Z" fill="#000000"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5303 5.46967C18.8232 5.76256 18.8232 6.23744 18.5303 6.53033L6.53035 18.5303C6.23745 18.8232 5.76258 18.8232 5.46969 18.5303C5.17679 18.2374 5.17679 17.7626 5.46968 17.4697L17.4697 5.46967C17.7626 5.17678 18.2374 5.17678 18.5303 5.46967Z" fill="#000000"/>
                        </svg>
                    {/if}
                </div>
                <div class="card !bg-error-500 w-[2.75rem] aspect-square">
                    {#if mistakes > 2}
                        <svg class="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" in:scale>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M5.46967 5.46967C5.76256 5.17678 6.23744 5.17678 6.53033 5.46967L18.5303 17.4697C18.8232 17.7626 18.8232 18.2374 18.5303 18.5303C18.2374 18.8232 17.7626 18.8232 17.4697 18.5303L5.46967 6.53033C5.17678 6.23744 5.17678 5.76256 5.46967 5.46967Z" fill="#000000"/>
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.5303 5.46967C18.8232 5.76256 18.8232 6.23744 18.5303 6.53033L6.53035 18.5303C6.23745 18.8232 5.76258 18.8232 5.46969 18.5303C5.17679 18.2374 5.17679 17.7626 5.46968 17.4697L17.4697 5.46967C17.7626 5.17678 18.2374 5.17678 18.5303 5.46967Z" fill="#000000"/>
                        </svg>
                    {/if}
                </div>
            </div>
        </footer>
    </div>
    <div class="hidden xl:block">
        <ChessGamePanel height="h-[min(calc(100vw)-1rem,calc(95vh-12rem))]" {chessStateStore} />
    </div>
    
    <button class="btn variant-filled-primary xl:hidden" on:click={openGamePanel}>Open Game Panel</button>
 </div>
