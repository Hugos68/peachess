<script lang="ts">
	import { applyAction, enhance, type SubmitFunction } from "$app/forms";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";

    const submitSignIn: SubmitFunction = () => {
        return async ({result}) => {
            await applyAction(result);
            if (result.type==='redirect') {
                const t: ToastSettings = {
                    message: 'Successfully signed in',
                    preset: 'success',
                    autohide: true
                }
                toastStore.trigger(t);
                return;
            }
            else if (result.type==='failure')  {
                const t: ToastSettings = {
                message: result.data?.message,
                preset: 'error',
                autohide: true
                }
                toastStore.trigger(t);
            }
        }
    }
</script>

<form action="/?/signIn" method="post" class="mx-auto mt-[7.5vh] max-w-lg flex flex-col gap-12 p-4" use:enhance={submitSignIn}>
    <h1 class="text-end">Sign In</h1>
    <label class="label-input input-label">
        Email:
        <input class="input" type="email" name="email">
    </label>
    <label>
        Password:
        <input class="input" type="password" name="password">
    </label>
    <a class="text-center" href="/sign-up">Don't have an account yet? Sign up here</a>
    <button class="btn variant-filled-primary" type="submit">Sign In</button>
</form>