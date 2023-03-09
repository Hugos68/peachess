<script lang="ts">
	import { page } from "$app/stores";
	import { antiAuthNavItems, authNavItems } from "$lib/util";
	import { drawerStore, LightSwitch } from "@skeletonlabs/skeleton";
	import ProfileButton from "./ProfileButton.svelte";
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
            {#each $page.data.session ? authNavItems : antiAuthNavItems as {label, href}}
                <li><a href={href} on:click={() => drawerStore.close()}>{label}</a></li>
            {/each}
        </ul>
    </nav>
    <LightSwitch />
    <hr class="my-8 mt-auto" />
    <p class="text-center">All Rights Reserved.</p>
</div>