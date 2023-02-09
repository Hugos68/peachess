<script lang="ts">
	import ChessBoard from "$lib/components/ChessBoard.svelte";
	import { Chess } from "chess.js";
    import type { PageData } from "./$types";

    export let data: PageData;

    const chessRecords: ChessRecord[] = data.chessRecords as ChessRecord[];

    console.log(chessRecords);
</script>

<h1>Browse games</h1>
<hr class="my-4" />
{#each chessRecords as chessRecord}
<div class="card p-4 pt-10 w-[20rem]">
    <p>Player White: {chessRecord.player_id_white}</p>
    <p>VS</p>
    <p>Player Black: {chessRecord.player_id_black}</p>
    <ChessBoard chess={new Chess(chessRecord.fen)} flipped={false} />
</div>

{/each}