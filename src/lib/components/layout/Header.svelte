<script lang="ts">
	import { page } from "$app/stores";
	import { antiAuthNavItems, authNavItems } from "$lib/util";
	import { AppBar, drawerStore, type DrawerSettings } from "@skeletonlabs/skeleton";
	import ProfileButton from "./ProfileButton.svelte";

	const openLeftSideBar = (): void => {
        const settings: DrawerSettings = { 
            id: 'sideBarLeft',
            position: 'left',
            width: 'w-[min(30rem,80vw]'
        };
	    drawerStore.open(settings);
	}
</script>

<AppBar class="h-16 justify-center" padding="px-[4vw]">
    <svelte:fragment slot="lead">
        <button class="btn p-0 md:hidden" on:click={openLeftSideBar}>
            <svg class="w-8 h-8" viewBox="0 0 100 100">
                <rect fill="currentColor" width="100" height="10" x="0" y="12"></rect>
                <rect fill="currentColor" width="100" height="10" x="0" y="46"></rect>
                <rect fill="currentColor" width="100" height="10" x="0" y="80"></rect>
            </svg>
        </button>
        <nav class="list-nav hidden md:flex ">
            {#each $page.data.session ? authNavItems : antiAuthNavItems  as {label, href}}
                <a class="nav-item" href={href}>{label}</a>
            {/each}
        </nav>
    </svelte:fragment>
    <svelte:fragment slot="trail">
        {#if $page.data.session}
            <ProfileButton />
        {/if}
        <a class="font-bold text-2xl" href="/">Peachess</a>
    </svelte:fragment>
</AppBar>