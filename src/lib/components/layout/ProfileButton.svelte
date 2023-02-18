<script lang="ts">
	import { applyAction, enhance, type SubmitFunction } from "$app/forms";
	import { page } from "$app/stores";
	import { Avatar, menu, toastStore, type ToastSettings } from "@skeletonlabs/skeleton";

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
<span class="relative">
    <button class="btn" use:menu={{ menu: 'avatar-dropdown' }}>
        <Avatar width="w-10" initials={$page.data.session.user.email} />
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