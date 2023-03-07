<script lang="ts">
	import { modalStore, type ModalComponent, type ModalSettings } from "@skeletonlabs/skeleton";
	import NewGameComputerModal from "./NewGameComputerModal.svelte";
	import NewGamePlayerModal from "./NewGamePlayerModal.svelte";


</script>

<div class="card p-8 flex flex-col gap-4">
    <h2 class="text-center"><strong>Start a new game</strong></h2>
    <div class="flex justify-between gap-4">
        <button class="btn variant-ghost-primary !aspect-square w-[calc(50%-1rem)]" on:click={openNewGamePlayerModal}>VS Player</button>
        <button class="btn variant-ghost-primary !aspect-square w-[calc(50%-1rem)]" on:click={openNewGameComputerModal}>VS Computer</button>
    </div>
</div>

