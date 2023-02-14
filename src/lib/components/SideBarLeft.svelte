<script lang="ts">
	import { page } from "$app/stores";
	import { LightSwitch } from "@skeletonlabs/skeleton";
	import ProfileButton from "./ProfileButton.svelte";

    interface navItem {
        label: string
        link: string
    }
    
    const navItems: navItem[] = [
        { label: 'Home', link: '/home' },
        { label: 'Games', link: '/games' },
        { label: 'Social', link: '/social' }
    ];
</script>

<div class="min-h-screen w-[20rem] bg-surface-50-000-token p-8 flex flex-col">
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
                <li><a href={navItem.link}>{navItem.label}</a></li>
            {/each}
            {#if !$page.data.session}
                <li><a class="btn btn-lg variant-filled-primary" href="/sign-in">Sign In</a></li>
                <li><a class="btn btn-lg variant-filled-primary" href="/sign-up">Sign Up</a></li>
            {/if}
        </ul>
    </nav>
 
    <hr class="my-8 mt-auto" />
    <footer class="flex items-center justify-evenly">
        <p class="text-center">All Rights Reserved.</p>
        <LightSwitch />
    </footer>
</div>