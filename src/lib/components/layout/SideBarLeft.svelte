<script lang="ts">
	import { page } from "$app/stores";
	import { drawerStore, LightSwitch } from "@skeletonlabs/skeleton";
	import ProfileButton from "./ProfileButton.svelte";

    const navItems = [
        { label: 'Home', href: '/home' },
        { label: 'Games', href: '/games' },
        { label: 'Puzzles', href: '/puzzles' },
        { label: 'Social', href: '/social' }
    ];
</script>

<div class="h-screen !w-[min(30rem,80vw] p-8 flex flex-col ">
    <header class="flex justify-between items-center">
        <a class="unstyled font-bold text-3xl" href="/">Peachess</a>
        {#if $page.data.session}
            <ProfileButton />
        {/if}
    </header>
    <hr class="my-4" /> 

    <nav class="mx-auto w-full">
        <ul class="flex flex-col list-nav">
            {#each navItems as {label, href}}
                <li><a href={href} on:click={() => drawerStore.close()}>{label}</a></li>
            {/each}
            {#if !$page.data.session}
                <li><a href="/sign-in" on:click={() => drawerStore.close()}>Sign In</a></li>
                <li><a href="/sign-up" on:click={() => drawerStore.close()}>Sign Up</a></li>
            {/if}
        </ul>
    </nav>
    <LightSwitch />
    <hr class="my-8 mt-auto" />
    <p class="text-center">All Rights Reserved.</p>
</div>