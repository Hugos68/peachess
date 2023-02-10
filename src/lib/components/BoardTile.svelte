<script lang="ts">
	import { createEventDispatcher } from "svelte";
    import { currentlyDraggedPiece, fromSquare, toSquare } from "$lib/stores";

    export let tile: Tile;
    export let tileNumber: number;
    export let rankNumber: number;
    export let flipped: boolean;

    const getTileColor = (rankNumber: number, tileNumber: number): string => {
        if (rankNumber%2 === 0) {
            return tileNumber%2 === 0 ? "bg-[var(--chess-light-tile-color)]" : "bg-[var(--chess-dark-tile-color)]";
        }
        else {
            return tileNumber%2 === 0 ? "bg-[var(--chess-dark-tile-color)]" : "bg-[var(--chess-light-tile-color)]";
        }
    }

    const getTile = (rankNumber: number, tileNumber: number): string => {
        if (flipped) {
            rankNumber+=1;
            tileNumber = 8 - tileNumber;
        }
        else {
            rankNumber = 8 - rankNumber;
            tileNumber+=1;fromSquare
        }
        return String.fromCharCode(96 + tileNumber) + rankNumber;
    }

    const dispatch = createEventDispatcher();

    function dispatchMove(move: string) {
        dispatch('move', {
            move
        });
    }

    const handleDragStart = (event: any) => {
        fromSquare.set(event.target.dataset.square);
        currentlyDraggedPiece.set(event.target);
    }

    const handleDrop = (event: any) => {
        toSquare.set(event.target.dataset.square);
        if ($currentlyDraggedPiece && 
            $fromSquare && 
            $toSquare && 
            ($fromSquare!==$toSquare)
        ) dispatchMove($fromSquare as string + $toSquare as string);
        else {
            fromSquare.set(null);
            toSquare.set(null);
        }
        currentlyDraggedPiece.set(null);
    }
</script>

<td 
class="{getTileColor(rankNumber, tileNumber)} dropzone relative text-base-token transition-opacity duration-200"
data-square={getTile(rankNumber,tileNumber)}
on:dragover|preventDefault
on:drop={handleDrop}
>
    {#if tile !==null}
        <img 
        class="z-[1] top-0 absolute" 
        draggable="true" 
        src="https://www.chess.com/chess-themes/pieces/neo/150/{tile.color}{tile.type}.png" 
        alt="{tile.color}{tile.type}"
        data-square={getTile(rankNumber, tileNumber)}  
        on:dragstart={handleDragStart} 
        >
    {/if}
    {#if tileNumber===0 && flipped}
        <p class="absolute top-1 left-1">{rankNumber+1}</p>
    {:else if tileNumber===0}
        <p class="absolute top-1 left-1">{8-rankNumber}</p>
    {/if}
    {#if rankNumber==7 && flipped}
        <p class="absolute bottom-1 right-1">{String.fromCharCode(96 + (8-tileNumber))}</p>
    {:else if rankNumber===7  }
        <p class="absolute bottom-1 right-1">{String.fromCharCode(96 + (tileNumber+1))}</p>
    {/if}
</td>