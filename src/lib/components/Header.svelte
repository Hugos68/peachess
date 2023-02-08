<script lang="ts">
	import { applyAction, enhance, type SubmitFunction } from "$app/forms";
	import { page } from "$app/stores";
	import { AppBar, Avatar, menu, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";

    interface navItem {
        label: string
        link: string
    }
    
    const routes: navItem[] = [
        { label: 'Sign In', link: '/sign-in' },
        { label: 'Sign Up', link: '/sign-up' }
    ];

    const submitSignOut: SubmitFunction = () => {
        return async ({result}) => {
            await applyAction(result);
            if (result.type==='redirect') {
                const t: ToastSettings = {
                    message: 'Successfully signed out',
                    preset: 'success',
                    autohide: true
                }
                toastStore.trigger(t);
                return;
            }
            const t: ToastSettings = {
                message: result.data?.message,
                preset: 'error',
                autohide: true
            }
            toastStore.trigger(t);
        }
    }
</script>

<AppBar class="h-[var(--header-height)] justify-center" padding="px-[4vw]">
    <svelte:fragment slot="lead">
        <a href="/"><h1>🍑 Peachess</h1></a>
    </svelte:fragment>
    <svelte:fragment slot="trail">
        {#if $page.data.session}
            <span class="relative">
                <button class="btn" use:menu={{ menu: 'avatar-dropdown' }}>
                    <Avatar initials={$page.data.session.user.email} />
                </button>
                <nav class="list-nav card p-4 shadow-xl flex flex-col gap-4" data-menu="avatar-dropdown">
                    <ul>
                        <li><a href="/account">Account</a></li>
                        <li>
                            <form action="/?/signOut" method="post" use:enhance={submitSignOut}>
                                <button class="btn variant-filled-error w-full">Logout</button>
                            </form>
                        </li>
                    </ul>
                </nav>
            </span>
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