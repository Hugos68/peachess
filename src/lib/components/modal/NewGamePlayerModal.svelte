<script lang="ts">
	import { goto } from "$app/navigation";
	import { supabase } from "$lib/supabase";
	import { modalStore, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";

    let opponentUsername: string

    const createOnlineGame = async () => {
        modalStore.clear();
        const {error, data} = await supabase.functions.invoke("create_game", {
            body:  {
                opponentUsername: opponentUsername
            }
        }); 
        if (error) {
            const toast: ToastSettings = {
                background: 'error',
                message: 'Oops, something went wrong, did you spel their username correctly?',
                autohide: true
            }
            toastStore.trigger(toast);
        }
        else {
            const toast: ToastSettings = {
                message: 'Success, redirecting you to the game...',
                autohide: true
            }
            toastStore.trigger(toast);
            await goto(`/games/${data.game.id}`);
        }
    }

</script>

<div class="card p-8 flex flex-col gap-4">
    <h2 class="text-center"><strong>Play against a Player</strong></h2>
    <div class="flex flex-col justify-center gap-4">
        <input type="text" class="input p-2" placeholder="Enter opponents username..." required bind:value={opponentUsername} />
        <button class="ml-auto btn btn-lg variant-filled-primary" on:click={createOnlineGame}>Create Game</button>
    </div>
</div>
