<script lang="ts">
	import { page } from "$app/stores";
	import { LightSwitch } from "@skeletonlabs/skeleton";
	import ProfileButton from "./ProfileButton.svelte";

    interface navItem {
        label: string
        link: string
    }
    
    const routes: navItem[] = [
        { label: 'Sign In', link: '/sign-in' },
        { label: 'Sign Up', link: '/sign-up' }
    ];
</script>

<div class="min-h-screen w-[20rem] bg-surface-200-700-token p-4 flex flex-col">
    <header class="flex justify-between items-center">
        <a class="unstyled font-bold text-3xl" href="/">🍑 Peachess</a>
        {#if $page.data.session}
            <ProfileButton />
        {/if}
    </header>
    <hr class="my-4" />
    {#if !$page.data.session}
        <nav class="mx-auto mt-auto">
            <ul class="flex gap-8">
                {#each routes as navItem}
                    <li><a class="btn btn-lg variant-filled-primary" href={navItem.link}>{navItem.label}</a></li>
                {/each}
            </ul>
        </nav>
    {/if}
    <hr class="my-4 mt-auto" />
    <footer class="flex items-center justify-evenly">
        <p class="text-center">Peachess, All Rights Reserved</p>
        <LightSwitch />
    </footer>
</div>