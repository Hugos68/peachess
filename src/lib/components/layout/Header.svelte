<script lang="ts">
	import { AppBar, drawerStore, type DrawerSettings } from "@skeletonlabs/skeleton";

	const openLeftSideBar = (): void => {
        const settings: DrawerSettings = { 
            id: 'sideBarLeft',
            position: 'left',
            width: 'w-[min(30rem,80vw]'
        };
	    drawerStore.open(settings);
	}
</script>

<AppBar class="h-16 justify-center !bg-tertiary-500" padding="px-[4vw]">
    <svelte:fragment slot="lead">
        <button class="btn p-0" on:click={openLeftSideBar}>
            <svg class="w-8 h-8" viewBox="0 0 100 100">
                <rect fill="currentColor" width="100" height="10" x="0" y="12"></rect>
                <rect fill="currentColor" width="100" height="10" x="0" y="46"></rect>
                <rect fill="currentColor" width="100" height="10" x="0" y="80"></rect>
            </svg>
        </button>
    </svelte:fragment>
    <svelte:fragment slot="trail">
        <a class="font-bold text-2xl" href="/">Peachess</a>
    </svelte:fragment>
</AppBar>