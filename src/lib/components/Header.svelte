<script lang="ts">
	import { page } from "$app/stores";
	import { AppBar } from "@skeletonlabs/skeleton";

    interface navItem {
        label: string
        link: string
    }
    
    let routes: navItem[];
    $: if ($page.data.session) {
        routes = [
            { label: 'Play', link: '/play' },
            { label: 'Account', link: '/account' }
        ];
    }
    $: if (!$page.data.session) {
        routes = [
            { label: 'Sign In', link: '/sign-in' },
            { label: 'Sign Up', link: '/sign-up' }
        ];
    }
</script>

<AppBar class="h-[var(--header-height)] justify-center">
    <svelte:fragment slot="lead">
        <h1>Peachess</h1>
    </svelte:fragment>
    <svelte:fragment slot="trail">
        <nav>
            <ul class="flex list-nav">
                {#each routes as navItem}
                    <li><a href={navItem.link}>{navItem.label}</a></li>
                {/each}
            </ul>
        </nav>
    </svelte:fragment>
</AppBar>