<script lang="ts">
	import ChessBoard from "$lib/components/ChessBoard.svelte";
	import { Chess } from "chess.js";
    import type { PageData } from "./$types";

    export let data: PageData;

    const chessRecords: ChessRecord[] = data.chessRecords as ChessRecord[];
</script>

<h1>Browse games</h1>

<hr class="my-4" />

<div class="flex flex-wrap">
    {#each chessRecords as chessRecord}
    <a class="card card-hover p-4 w-[20rem]" href="/games/{chessRecord.id}">
        <p>Player White: {chessRecord.player_id_white}</p>
        <p>VS</p>
        <p>Player Black: {chessRecord.player_id_black}</p>
     
        <ChessBoard chess={new Chess(chessRecord.fen)} flipped={false} />
    </a>
{/each}
</div>
