<script lang="ts">
	import { clipboard, RangeSlider, SlideToggle, Tab, TabGroup, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
    import { settings } from "$lib/stores/settings-store";
    import type { ChessStateStore } from "$lib/stores/chess-store";
	import { page } from "$app/stores";
	import { onMount } from "svelte";

    export let chessStateStore: ChessStateStore;
    
    let tabSet: number = 0
        
	const triggerCopiedToast = (type: 'Link' | 'FEN' | 'PGN') => {
        const t: ToastSettings = {
            message: 'Successfully copied: '+type,
            preset: 'success',
            autohide: true
        }
        toastStore.trigger(t);
	}

    let mounted: boolean = false;
    onMount(() => mounted = true)
    $: if (mounted) {
        scrollMoveIntoView($chessStateStore.moveStack.length-1);
    } 

    function scrollMoveIntoView(moveId: number) {
        const moveElement = document.getElementById(`move-${moveId}`);
        if (!moveElement) return;
        moveElement.scrollIntoView({ block: 'nearest', inline: 'start' });
    }
</script>

<TabGroup regionPanel="flex-1 flex flex-col overflow-hidden" class="h-full w-full card !bg-surface-100-800-token p-4 flex flex-col">
    <Tab bind:group={tabSet} name="moves" value={0}>Moves</Tab>
    <Tab bind:group={tabSet} name="chat" value={1}>Chat</Tab>
    <Tab bind:group={tabSet} name="settings" value={2}>Settings</Tab>
    <Tab bind:group={tabSet} name="share" value={3}>Share</Tab>

    <svelte:fragment slot="panel">
        {#if tabSet === 0}
        {@const activeMoveIndex = $chessStateStore.moveStack.length-1}
            <ul class="overflow-y-scroll flex-1 grid grid-cols-3 place-items-start justify-items-center" id="move-list">
                <span class="p-1"><strong>Move</strong></span>
                <span class="p-1"><strong>White</strong></span>
                <span class="p-1"><strong>Black</strong></span>
                {#each $chessStateStore.moveStack.concat($chessStateStore.undoneMoveStack.slice().reverse()) as move, i} 
                        {#if i%2===0}
                            <li class="px-4 rounded-token">{i/2+1}</li>
                        {/if}
                        <li class="px-4 rounded-token" class:bg-primary-500={activeMoveIndex===i} id="move-{i}">{move.from + move.to}</li>
                {/each}
            </ul>
        {:else if tabSet === 1}
            <p>Coming soon</p>
        {:else if tabSet === 2}
            <div class="flex flex-col">
                <label class="flex items-center gap-2 justify-between" for="animate">
                    Animate
                    <SlideToggle class="variant-ghost-secondary" name="animate" bind:checked={$settings.animate}  />
                </label>
                <label class="flex items-center gap-2 justify-between" for="animate">
                    Animation duration ({$settings.animationDuration} ms)
                    <RangeSlider name="animation-duration" bind:value={$settings.animationDuration} min={0} max={1000} step={50} ticked />
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
                <label class="flex items-center gap-2 justify-between" for="lastmovehighlight">
                    Highlight last move
                    <SlideToggle name="lastmovehighlight" bind:checked={$settings.lastMoveHighlight} />
                </label>
                <label class="flex items-center gap-2 justify-between" for="checkhighlight">
                    Highlight checks
                    <SlideToggle name="checkhighlight" bind:checked={$settings.checkHighlight} />
                </label>
            </div>
        {:else if tabSet === 3}
            <p class="text-xl font-bold text-center">Click to copy</p>

            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div class="flex flex-col justify-between gap-2">
                <label for="fen" use:clipboard={$page.url} on:click={() => triggerCopiedToast('Link')}>
                    Link:
                    <input  class="input" type="text" readonly value={$page.url} />
                </label>
                <label use:clipboard={$chessStateStore.chess.fen()} on:click={() => triggerCopiedToast('FEN')}>
                    FEN:
                    <input class="input" type="text" readonly value={$chessStateStore.chess.fen()} />
                </label>
                <label use:clipboard={$chessStateStore.chess.pgn()} on:click={() => triggerCopiedToast('PGN')}>
                    PGN:
                    <textarea class="input resize-none rounded-lg" rows=10 readonly value={$chessStateStore.chess.pgn()} />
                </label>
            </div>
        {/if}
    </svelte:fragment>
</TabGroup>