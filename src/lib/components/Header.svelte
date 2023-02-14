<script lang="ts">
	import { page } from "$app/stores";
	import { AppBar, LightSwitch} from "@skeletonlabs/skeleton";
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

<AppBar class="h-16 justify-center" padding="px-[4vw]">
    <svelte:fragment slot="lead">
        <a class="font-bold text-2xl" href="/">Peachess</a>
    </svelte:fragment>
    <svelte:fragment slot="trail">
                <LightSwitch />
        {#if $page.data.session}
            <ProfileButton />
        {:else}
            <nav>
                <ul class="flex gap-8">
                    {#each routes as navItem}
                        <li><a class="btn variant-filled-primary" href={navItem.link}>{navItem.label}</a></li>
                    {/each}
                </ul>
            </nav>
        {/if}
    </svelte:fragment>
</AppBar>