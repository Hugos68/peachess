<script lang="ts">
	import BoardTile from "./BoardTile.svelte";

    export let rank: Tile[];
    export let rankNumber: number;
    export let flipped: boolean;

    const getArrayOrder = (array: any[]) => {
        return flipped ? array.reverse() : array;
    }
</script>

<tr>
    {#each getArrayOrder(rank) as tile, j} 
        <BoardTile tile={tile} tileNumber={j} rankNumber={rankNumber} flipped={flipped} on:move/>
    {/each}
</tr>