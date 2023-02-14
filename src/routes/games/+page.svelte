<script lang="ts">
	import { goto } from "$app/navigation";
	import { page } from "$app/stores";
	import { supabase } from "$lib/supabase";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";

    if ($page.url.searchParams.get('message')) {
        const t: ToastSettings = {
            preset: 'error',
            message: $page.url.searchParams.get('message') || 'Something went wrong',
            autohide: true,
        }
        toastStore.trigger(t);
    }   

    let opponentUsername: string;

    const createGame = async () => {
        const {data, error} = await supabase.functions.invoke('create_game',  {
            body: JSON.stringify({ opponentUsername: opponentUsername })
        });
        if (data)  {
            const t: ToastSettings = {
                    message: 'Succesfully created game',
                    preset: 'success',
                    autohide: true
                }
                toastStore.trigger(t);
            await goto(`/games/${data.game.id}`);
        }
    }
</script>

<input class="input" type="text" bind:value={opponentUsername} />
<button class="btn variant-filled-primary" on:click={createGame}>Make game</button>