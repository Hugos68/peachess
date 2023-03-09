<script lang="ts">
	import { applyAction, enhance, type SubmitFunction } from "$app/forms";
	import { toastStore, type ToastSettings } from "@skeletonlabs/skeleton";
    import { supabase } from "$lib/supabase";

    let usernameStatus: string;

    let username: string = '';
    let debounceTimer: ReturnType<typeof setTimeout>;
    const checkUsername = () => {
        usernameStatus = 'Checking';
        clearTimeout(debounceTimer);
               if (username.length < 4) {
            usernameStatus = '';
            return;
        }
        debounceTimer = setTimeout(async () => {
            
            // Get all profiles matching the username
            const {data, error} = await supabase
            .from('profiles')
            .select('*')
            .eq('user_name', username);

            // If there we 0 matches, the name is available
            if (data?.length===0) usernameStatus = 'Username available';

            // If there was a mtch the name is not available
            else usernameStatus = 'Username already taken';
        }, 750);
    }

    const submitSignUp: SubmitFunction = () => {
        return async ({result}) => {
            await applyAction(result);
            if (result.type==='redirect') {
                const t: ToastSettings = {
                    message: 'Signup success, please confirm your email',
                    background: 'success',
                    autohide: true
                }
                toastStore.trigger(t);
            }
            else if (result.type==='failure')  {
                const t: ToastSettings = {
                message: result.data?.message,
                background: 'error',
                autohide: true
                }
                toastStore.trigger(t);
            }
        }
    }
</script>

<form action="/?/signUp" method="post" class="mx-auto mt-[7.5vh] max-w-lg flex flex-col gap-12 p-4" use:enhance={submitSignUp}>
    <h1 class="text-end">Sign Up</h1>
    <label class="label-input input-label">
        Username:   
        <span class="relative">
            <input 
            class:!border-green-500={usernameStatus==='Username available'} 
            class:!border-red-500={usernameStatus==='Username already taken'} 
            class="input" 
            type="text" 
            name="username"
            minlength="4"
            maxlength="20"
            required
            bind:value={username} 
            on:input={checkUsername}>
            <p class="absolute right-12 top-[-2px]">
                {#if usernameStatus}
                    {usernameStatus}
                {/if}
            </p>
            {#if usernameStatus === 'Checking'}
                <svg class="w-6 h-6 animate-spin text-token absolute right-4 top-[-2px]" viewBox="0 0 1024 1024" fill="currentColor"><path d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z"/></svg>
            {:else if usernameStatus==='Username available'}
                <svg class="w-6 h-6 text-green-500 absolute right-4 top-[-2px]" viewBox="0 0 1024 1024" fill="currentColor"><path d="M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z"/></svg>
            {:else if usernameStatus==='Username already taken'}
                <svg class="w-6 h-6 text-red-500 absolute right-4 top-[-2px]" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.46967 5.46967C5.76256 5.17678 6.23744 5.17678 6.53033 5.46967L18.5303 17.4697C18.8232 17.7626 18.8232 18.2374 18.5303 18.5303C18.2374 18.8232 17.7626 18.8232 17.4697 18.5303L5.46967 6.53033C5.17678 6.23744 5.17678 5.76256 5.46967 5.46967Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18.5303 5.46967C18.8232 5.76256 18.8232 6.23744 18.5303 6.53033L6.53035 18.5303C6.23745 18.8232 5.76258 18.8232 5.46969 18.5303C5.17679 18.2374 5.17679 17.7626 5.46968 17.4697L17.4697 5.46967C17.7626 5.17678 18.2374 5.17678 18.5303 5.46967Z"/></svg>
            {/if}
        </span>
    </label>
    <label class="label-input input-label">
        Email:
        <input class="input" type="email" name="email" required>
    </label>
    <label>
        Password:
        <input class="input" type="password" name="password" required>
    </label>
    <label>
        Confirm Password:
        <input class="input" type="password" name="confirmPassword" required>
    </label>
    <a class="text-center" href="/sign-in">Already have an account? Sign in here</a>
    <button class="btn variant-filled-primary" type="submit">Sign Up</button>
</form>