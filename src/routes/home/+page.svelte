<script lang="ts">
	import { page } from "$app/stores";
	import type { PageData } from "../$types";

    export let data: PageData;
</script>
<p class="mt-[7.5vh] text-center !leading-tight !text-[clamp(2rem,5vw,3rem)]">Welcome,</p>
<p class="text-center !leading-tight !text-[clamp(1rem,5vw,3rem)]">{$page.data.session.user.email}</p>
<hr />
<h2 class="mt-[2.5vh]">Your games:</h2>
<div>
    {#each data.chessGames as chessGame}
        <p>chessGame.id</p>
    {/each}
</div>