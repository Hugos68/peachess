<script lang="ts">
    import type { PageData } from "./$types";

    export let data: PageData;

    const chessRecords: ChessRecord[] = data.chessRecords as ChessRecord[];
</script>


<h1>Browse games</h1>

<hr class="my-4" />

<div class="flex flex-wrap gap-4">
    {#each chessRecords as chessRecord}
        <a draggable="false" class="card card-hover flex flex-col justify-between p-4 gap-4 flex-[15rem]" href="/games/{chessRecord.id}">
            <div>
                <p>Player White: {chessRecord.player_id_white}</p>
                <p>VS</p>
                <p>Player Black: {chessRecord.player_id_black}</p>
            </div>
            <div id="board{chessRecord.id}" style="width: 400px"></div>
        </a>
    {/each}
</div>
