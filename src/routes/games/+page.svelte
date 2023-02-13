<script lang="ts">
	import { page } from "$app/stores";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";

    if ($page.url.searchParams.get('message')) {
        const t: ToastSettings = {
            preset: 'error',
            message: $page.url.searchParams.get('message') || 'Something went wrong',
            autohide: true,
            timeout: 3000
        }
        toastStore.trigger(t);
    }
</script>