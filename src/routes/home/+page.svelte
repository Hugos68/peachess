<script lang="ts">
    import { supabase } from "$lib/supabase";

    const invoke = async () => {
        const { data, error } = await supabase.functions.invoke('move', {
            body: {
                gameId: '1',
                move: 'e2e4'
            }
        });
        console.log(error ,data);
        
    }
</script>

<button class="btn variant-filled-primary" on:click={invoke}>Click to invoke edgeless function</button>