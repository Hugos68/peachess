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

    const navItems = [
        { label: 'Home', href: '/home' },
        { label: 'Games', href: '/games' },
        { label: 'Puzzles', href: '/puzzles' },
        { label: 'Social', href: '/social' }
    ];
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
        <nav class="list-nav flex">
            {#each navItems as {label, href}}
                <a class="nav-item" href={href}>{label}</a>
            {/each}
        </nav>
    </svelte:fragment>
    <svelte:fragment slot="trail">
        <a class="font-bold text-2xl" href="/">Peachess</a>
    </svelte:fragment>
</AppBar>