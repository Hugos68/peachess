<script lang="ts">
    export let chessStateStore: ChessStateStore;
</script>

<svelte:window
    on:keydown={(event) => {
        if (event.key==='ArrowLeft') chessStateStore.loadPreviousMove();
        else if (event.key==='ArrowRight') chessStateStore.loadNextMove();
        else if (event.key==='ArrowUp') chessStateStore.loadLastMove();
        else if (event.key==='ArrowDown') chessStateStore.loadFirstMove();
    }}
/>

<div class="flex gap-0.5 md:gap-1">
            
    <button disabled={$chessStateStore.moveStack.length===0} on:click={chessStateStore.loadFirstMove} class="btn btn-sm variant-filled-primary">
        <svg class="w-4 sm:w-6 md:w-8 h-8" viewBox="0 0 1920 1920">
            <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z"/>
            <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z"/>
        </svg>
    </button>
    <button disabled={$chessStateStore.moveStack.length===0} on:click={chessStateStore.loadPreviousMove} class="btn btn-sm variant-filled-primary">
        <svg class="w-4 sm:w-6 md:w-8 h-8" viewBox="0 0 1920 1920">
            <path d="m1394.006 0 92.299 92.168-867.636 867.767 867.636 867.636-92.299 92.429-959.935-960.065z" fill-rule="evenodd"/>
        </svg>
    </button>   
    <button disabled={$chessStateStore.undoneMoveStack.length===0} on:click={chessStateStore.loadNextMove} class="btn btn-sm variant-filled-primary">
        <svg class="w-4 sm:w-6 md:w-8 h-8 rotate-180" viewBox="0 0 1920 1920">
            <path d="m1394.006 0 92.299 92.168-867.636 867.767 867.636 867.636-92.299 92.429-959.935-960.065z" fill-rule="evenodd"/>
        </svg>
    </button>
    <button disabled={$chessStateStore.undoneMoveStack.length===0} on:click={chessStateStore.loadLastMove} class="btn btn-sm variant-filled-primary">
        <svg class="w-4 sm:w-6 md:w-8 h-8 rotate-180" viewBox="0 0 1920 1920">
            <path d="M1052 92.168 959.701 0-.234 959.935 959.701 1920l92.299-92.43-867.636-867.635L1052 92.168Z"/>
            <path d="M1920 92.168 1827.7 0 867.766 959.935 1827.7 1920l92.3-92.43-867.64-867.635L1920 92.168Z"/>
        </svg>
    </button>
</div>

