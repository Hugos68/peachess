<script lang="ts">
	import { goto } from "$app/navigation";
	import { getAIDifficulityByName } from "$lib/util";
	import { ListBox, ListBoxItem, modalStore, popup, toastStore, type PopupSettings, type ToastSettings, type ToastSettings } from "@skeletonlabs/skeleton";

    let computerName: 'George' | 'Bob' | 'Will' | 'Matt' | 'Peter' | undefined;

    const createComputerGame = async () => {
        modalStore.close();
        const toast: ToastSettings = {
            preset: 'success',
            message: 'Success, redirecting you to the game...',
            autohide: true
        }
        toastStore.trigger(toast);
        await goto(`/games/computer?name=${computerName}`);
    }

    let computerNamePopup: PopupSettings = {
		event: 'click',
		target: 'computer-name',
		placement: 'bottom',
		closeQuery: '.listbox-item'
	};
</script>


<div class="card p-8 flex flex-col gap-8">
    <h2 class="text-center"><strong>Play against a computer</strong></h2>
    <div class="flex justify-between items-center">
        <p class="whitespace-nowrap">
            Difficulity level: 
            {#if computerName}
                {getAIDifficulityByName(computerName)}
            {/if}
        </p>
        <button class="btn variant-filled w-48 justify-between" use:popup={computerNamePopup}>
            <span class="capitalize">{computerName ?? 'Choose a computer'}</span>
            <i class="fa-solid fa-caret-down opacity-50" />
        </button>
    </div>

    <div class="card w-48 bg-red-500 shadow-xl overflow-hidden z-[100]" data-popup="computer-name">
        <ListBox>
            <ListBoxItem bind:group={computerName} name="medium" value="George">George</ListBoxItem>
            <ListBoxItem bind:group={computerName} name="medium" value="Bob">Bob</ListBoxItem>
            <ListBoxItem bind:group={computerName} name="medium" value="Will">Will</ListBoxItem>
            <ListBoxItem bind:group={computerName} name="medium" value="Matt">Matt</ListBoxItem>
            <ListBoxItem bind:group={computerName} name="medium" value="Peter">Peter</ListBoxItem>
        </ListBox>
    </div>
    <button class="btn variant-filled-secondary" disabled={!computerName} on:click={createComputerGame}>Create Game</button>
</div>