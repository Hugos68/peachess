<script lang="ts">
	import { page } from "$app/stores";
	import { AppBar, drawerStore, LightSwitch, type DrawerSettings, type ModalSettings} from "@skeletonlabs/skeleton";
	import ProfileButton from "./ProfileButton.svelte";

    interface navItem {
        label: string
        link: string
    }
    
    const navItems: navItem[] = [
        { label: 'Home', link: '/home' },
        { label: 'Games', link: '/games' },
    ];

	const openLeftSideBar = (): void => {
        const settings: DrawerSettings = { 
            id: 'sideBarLeft',
            position: 'left',
            width: 'w-[20rem]'
        };
	    drawerStore.open(settings);
	}
</script>

<AppBar class="h-16 justify-center !bg-transparent" padding="px-[4vw]">
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