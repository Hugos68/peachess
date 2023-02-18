<script lang="ts">
	import { clipboard, SlideToggle, Tab, TabGroup, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
    import { settings } from "$lib/stores";
	import { page } from "$app/stores";

    export let chessStore: any;
    
    let tabSet: number = 0
        
	const triggerCopiedToast = (type: 'Link' | 'FEN' | 'PGN') => {
        const t: ToastSettings = {
            message: 'Successfully copied: '+type,
            preset: 'success',
            autohide: true
        }
        toastStore.trigger(t);
	}
</script>

<TabGroup regionPanel="flex-1 flex flex-col overflow-hidden" class="h-full w-full card !bg-secondary-700 p-4 flex flex-col">
    <Tab bind:group={tabSet} name="moves" value={0}>Moves</Tab>
    <Tab bind:group={tabSet} name="chat" value={1}>Chat</Tab>
    <Tab bind:group={tabSet} name="settings" value={2}>Settings</Tab>
    <Tab bind:group={tabSet} name="share" value={3}>Share</Tab>

    <svelte:fragment slot="panel">
        {#if tabSet === 0}
            <div class="flex gap-2">
                <span class="flex-1 p-1"><strong>No.</strong></span>
                <span class="flex-1 p-1"><strong>White</strong></span>
                <span class="flex-1 p-1"><strong>Black</strong></span>
            </div>
            {#key $chessStore}
                <ul id="moveList" class="overflow-scroll flex-1">
                    {#each chessStore.getTotalMoveHistory() as move, i} 
                        {#if i%2===0}
                            <li id="move{i}" class="w-full flex gap-2">
                                <span class="flex-1 p-1">{i/2+1}</span>
                                <span class="flex-1 p-1 rounded-token {chessStore.getCurrentMoveHistory().length-1===i ? "bg-primary-500/50" : ""}">{move.san}</span>
                                <span class="flex-1 p-1 rounded-token {chessStore.getCurrentMoveHistory().length-1===i+1 ? "bg-primary-500/50" : ""}">
                                    {#if chessStore.getTotalMoveHistory()[i+1]}
                                        {chessStore.getTotalMoveHistory()[i+1].san}
                                    {/if}
                                </span>
                            </li>
                        {/if}
                    {/each}
                </ul>
            {/key}
        {:else if tabSet === 1}
                <p>Coming soon</p>
        {:else if tabSet === 2}
            <div class="flex flex-col">
                <label class="flex items-center gap-2 justify-between" for="animate">
                    Animate
                    <SlideToggle class="variant-ghost-secondary" name="animate" bind:checked={$settings.animate}  />
                </label>
                <label class="flex items-center gap-2 justify-between" for="drag">
                    Drag
                    <SlideToggle name="drag" bind:checked={$settings.drag} />
                </label>
                <label class="flex items-center gap-2 justify-between" for="sfx">
                    Sound Effects
                    <SlideToggle name="sfx" bind:checked={$settings.sfx} />
                </label>
                <label class="flex items-center gap-2 justify-between" for="premove">
                    Premove
                    <SlideToggle name="premove" bind:checked={$settings.premove} />
                </label>
            </div>
        {:else if tabSet === 3}
            <p class="text-xl font-bold text-center">Click to copy</p>
            <div class="flex flex-col gap-8">
                <label use:clipboard={$page.url} on:click={() => triggerCopiedToast('Link')}>
                    Link:
                    <input class="input" type="text" readonly value={$page.url} />
                </label>
                <label use:clipboard={$chessStore.fen()} on:click={() => triggerCopiedToast('FEN')}>
                    FEN:
                    <input class="input" type="text" readonly value={$chessStore.fen()} />
                </label>
                <label use:clipboard={$chessStore.pgn()} on:click={() => triggerCopiedToast('PGN')}>
                    PGN:
                    <textarea class="input resize-none" rows=10 readonly value={$chessStore.pgn()} />
                </label>
            </div>
        {/if}
    </svelte:fragment>
</TabGroup>