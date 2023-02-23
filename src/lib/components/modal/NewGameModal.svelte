<script lang="ts">
	import { goto } from "$app/navigation";
	import { supabase } from "$lib/supabase";
	import { modalStore, Tab, TabGroup, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";


    let opponentUsername: string, AIDifficulity: 0 | 1 | 2 | 3 | 4;

    const createOnlineGame = async () => {
        modalStore.close();
        const {error, data} = await supabase.functions.invoke("create_game", {
            body:  {
                opponentUsername: opponentUsername
            }
        }); 
        if (error) {
            const toast: ToastSettings = {
                preset: 'error',
                message: 'Oops, something went wrong, did you spel their username correctly?',
                autohide: true
            }
            toastStore.trigger(toast);
        }
        else {
            const toast: ToastSettings = {
                preset: 'success',
                message: 'Success, redirecting you to the game...',
                autohide: true
            }
            toastStore.trigger(toast);
            await goto(`/games/${data.game.id}`);
        }
    }

    const createComputerGame = async () => {
        modalStore.close();
        const toast: ToastSettings = {
                preset: 'success',
                message: 'Success, redirecting you to the game...',
                autohide: true
            }
            toastStore.trigger(toast);
        await goto(`/games/computer?difficulity=${AIDifficulity}`);
    }

    let tabSet: number = 0;
</script>
<TabGroup>
	<Tab bind:group={tabSet} name="vs-player" value={0}>VS Player</Tab>
    <Tab bind:group={tabSet} name="vs-computer" value={1}>VS Computer</Tab>



    <svelte:fragment slot="panel">
		{#if tabSet === 0}
            <div class="flex flex-col justify-center gap-4">
                <input type="text" class="input p-2" placeholder="Enter opponents username..." required bind:value={opponentUsername} />
                <button class="ml-auto btn btn-lg variant-filled-primary" on:click={createOnlineGame}>Create Game</button>
            </div>
		{:else if tabSet === 1}
        <div class="flex flex-col justify-center gap-4">
            <input type="number" min="0" max="4" class="input p-2" placeholder="Enter computers difficulity..." required bind:value={AIDifficulity} />
            <button class="ml-auto btn btn-lg variant-filled-primary" on:click={createComputerGame}>Create Game</button>
        </div>
		{/if}
	</svelte:fragment>
</TabGroup>
