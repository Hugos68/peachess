<script lang="ts">
	import { clipboard, SlideToggle, Tab, TabGroup, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
    import { settings } from "$lib/stores/settings-store";
	import { page } from "$app/stores";
	import type { Writable } from "svelte/store";
	import { onMount } from "svelte";

    export let chessStateStore: Writable<ChessState>;
    export let height: string;

    let mounted: boolean = false;
    onMount(() => mounted = true);
    $: if (mounted) scrollMoveIntoView($chessStateStore.moveStack.length-1);
        
	const triggerCopiedToast = (type: 'Link' | 'FEN' | 'PGN') => {
        const t: ToastSettings = {
            message: 'Successfully copied: '+type,
            autohide: true
        }
        toastStore.trigger(t);
	}

    function scrollMoveIntoView(moveId: number) {
        const moveElement = document.getElementById(`move-${moveId}`);
        if (!moveElement) return;
        moveElement.scrollIntoView({ block: 'nearest', inline: 'start' });
    }
    
    let tabSet: number = 0
</script>

<div>
    
</div>
<TabGroup regionPanel="flex-1 flex flex-col overflow-hidden" class="card bg-surface-300-600-token p-4 flex flex-col {height} w-[20rem]">
    <Tab bind:group={tabSet} name="moves" value={0}>Moves</Tab>
    <Tab bind:group={tabSet} name="settings" value={1}>Settings</Tab>
    <Tab bind:group={tabSet} name="share" value={2}>Share</Tab>

    <svelte:fragment slot="panel">
        {#if tabSet === 0}
        {@const activeMoveIndex = $chessStateStore.moveStack.length-1}
            <ul class="overflow-y-scroll flex-1 grid grid-cols-3 place-content-start justify-items-center" id="move-list">
                <span class="p-1"><strong>Move</strong></span>
                <span class="p-1"><strong>White</strong></span>
                <span class="p-1"><strong>Black</strong></span>
                {#each $chessStateStore.moveStack.concat($chessStateStore.undoneMoveStack.slice().reverse()) as move, i} 
                        {#if i%2===0}
                            <li class="px-4 rounded-token">{i/2+1}</li>
                        {/if}
                        <li class="px-4 rounded-token" class:bg-primary-500={activeMoveIndex===i} id="move-{i}">{move.san}</li>
                {/each}
            </ul>
        {:else if tabSet === 1}
            <div class="flex flex-col">
                <label class="flex items-center gap-2 justify-between" for="animate">
                    Animate
                    <SlideToggle active="variant-ghost-secondary" name="animate" bind:checked={$settings.animate}  />
                </label>
                <label class="flex items-center gap-2 justify-between" for="drag">
                    Drag
                    <SlideToggle active="variant-ghost-secondary" name="drag" bind:checked={$settings.drag} />
                </label>
                <label class="flex items-center gap-2 justify-between" for="sfx">
                    Sound Effects
                    <SlideToggle active="variant-ghost-secondary" name="sfx" bind:checked={$settings.sfx} />
                </label>
                <label class="flex items-center gap-2 justify-between" for="premove">
                    Premove
                    <SlideToggle active="variant-ghost-secondary" name="premove" bind:checked={$settings.premove} />
                </label>
                <label class="flex items-center gap-2 justify-between" for="lastmovehighlight">
                    Highlight last move
                    <SlideToggle active="variant-ghost-secondary" name="lastmovehighlight" bind:checked={$settings.lastMoveHighlight} />
                </label>
                <label class="flex items-center gap-2 justify-between" for="checkhighlight">
                    Highlight checks
                    <SlideToggle active="variant-ghost-secondary" name="checkhighlight" bind:checked={$settings.checkHighlight} />
                </label>
            </div>
        {:else if tabSet === 2}
            <p class="text-xl font-bold text-center">Click to copy</p>

            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="flex flex-col justify-between gap-2">
                <label for="link" use:clipboard={$page.url} on:click={() => triggerCopiedToast('Link')}>
                    Link:
                    <input name="link" class="input" type="text" readonly value={$page.url} />
                </label>
                <label for="FEN" use:clipboard={$chessStateStore.chess.fen()} on:click={() => triggerCopiedToast('FEN')}>
                    FEN:
                    <input name="FEN" class="input" type="text" readonly value={$chessStateStore.chess.fen()} />
                </label>
                <label for="PGN" use:clipboard={$chessStateStore.chess.pgn()} on:click={() => triggerCopiedToast('PGN')}>
                    PGN:
                    <textarea name="PGN"  class="input h-full resize-none rounded-lg" rows=10 readonly value={$chessStateStore.chess.pgn()} />
                </label>
            </div>
        {/if}
    </svelte:fragment>
</TabGroup>