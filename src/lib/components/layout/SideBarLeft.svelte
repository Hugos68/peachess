<script lang="ts">
	import { page } from "$app/stores";
	import { drawerStore } from "@skeletonlabs/skeleton";
	import ProfileButton from "./ProfileButton.svelte";

    interface navItem {
        label: string
        link: string
    }
    
    const navItems: navItem[] = [
        { label: 'Games', link: '/games' },
        { label: 'Social', link: '/social' }
    ];
</script>

<div class="h-screen !w-[min(30rem,80vw] p-8 flex flex-col bg-tertiary-500">
    <header class="flex justify-between items-center">
        <a class="unstyled font-bold text-3xl" href="/">Peachess</a>
        {#if $page.data.session}
            <ProfileButton />
        {/if}
    </header>
    <hr class="my-4" /> 

    <nav class="mx-auto w-full">
        <ul class="flex flex-col list-nav">
            {#each navItems as navItem}
                <li><a href={navItem.link} on:click={() => drawerStore.close()}>{navItem.label}</a></li>
            {/each}
            {#if !$page.data.session}
                <li><a href="/sign-in" on:click={() => drawerStore.close()}>Sign In</a></li>
                <li><a href="/sign-up" on:click={() => drawerStore.close()}>Sign Up</a></li>
            {/if}
        </ul>
    </nav>
 
    <hr class="my-8 mt-auto" />
    <p class="text-center">All Rights Reserved.</p>
</div>