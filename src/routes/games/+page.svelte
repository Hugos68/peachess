<script lang="ts">
	import { page } from "$app/stores";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
	import type { PageData } from "./$types";

    export let data: PageData;
    
    if ($page.url.searchParams.get('message')) {
        const t: ToastSettings = {
            preset: 'error',
            message: $page.url.searchParams.get('message') || 'Something went wrong',
            autohide: true,
        }
        toastStore.trigger(t);
    } 
</script>


<div class="mt-[5vh] flex flex-col gap-8">
    <h1 >Games</h1>
    <div class="ml-auto w-min flex gap-4">
        <button class=" btn btn-sm variant-filled-primary">+ New Game</button>
    </div>
</div>
