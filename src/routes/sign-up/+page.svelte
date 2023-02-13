<script lang="ts">
	import { applyAction, enhance, type SubmitFunction } from "$app/forms";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";

    const submitSignUp: SubmitFunction = () => {
        return async ({result}) => {
            await applyAction(result);
            if (result.type==='redirect') {
                const t: ToastSettings = {
                    message: 'Singup success, please confirm your email',
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

<form action="/?/signUp" method="post" class="mx-auto mt-[7.5vh] max-w-lg flex flex-col gap-12 p-4" use:enhance={submitSignUp}>
    <h1 class="text-end">Sign Up</h1>
    <label class="label-input input-label">
        Display name:
        <input class="input" type="text" name="displayName">
    </label>
    <label class="label-input input-label">
        Email:
        <input class="input" type="email" name="email">
    </label>
    <label>
        Password:
        <input class="input" type="password" name="password">
    </label>
    <label>
        Confirm Password:
        <input class="input" type="password" name="confirmPassword">
    </label>
    <a class="text-center" href="/sign-in">Already have an account? Sign in here</a>
    <button class="btn variant-filled-primary" type="submit">Sign Up</button>
</form>