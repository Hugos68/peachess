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

<div class="min-h-screen w-[min(30rem,80vw] bg-surface-50-000-token p-8 flex flex-col">
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
                <li class="!mt-auto"><a class="!mt-auto" href="/sign-in">Sign In</a></li>
                <li><a href="/sign-up">Sign Up</a></li>
            {/if}
        </ul>
    </nav>
 
    <hr class="my-8 mt-auto" />
    <footer class="flex items-center justify-between">
        <p class="text-center">Theme: </p>
        <LightSwitch />
    </footer>
</div>