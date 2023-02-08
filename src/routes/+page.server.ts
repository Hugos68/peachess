import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import { AuthApiError, type Provider } from "@supabase/supabase-js";
import { fail, type Actions, redirect } from "@sveltejs/kit";

export const actions: Actions = {
    signUp: async(event) => {
        const {request} = event;
        const body = Object.fromEntries(await request.formData());

        if (body.password!==body.confirmPassword) return fail(400, { message: 'Password mismatch' });
         
        
        if (!body.email || !body.password) return fail(400, { message: 'Please fill in all fields' });
        
        const {supabaseClient} = await getSupabase(event);

        const {error: err, data}  = await supabaseClient.auth.signUp({
            email: body.email as string,
            password: body.password as string
        });

        // Janky hotfix to check wether an email is taken or not until supabase gives us a better solution
        if (data?.user?.identities?.length === 0){
            return fail(500, {
                message: "Email is already registered"
            });
        }

        if (err) {
            if (err instanceof AuthApiError && err.status === 400) return fail(400, { message: err.message });
            return fail(500, { message: err.message });
        }

        return {success: true}
    },
    signIn: async(event) => {
        const {request, url} = event;
        const body = Object.fromEntries(await request.formData());

        const {supabaseClient} = await getSupabase(event);

        const provider = url.searchParams.get("provider") as Provider;

        if (provider) {
            const {data, error: err } = await supabaseClient.auth.signInWithOAuth({
                provider: provider
            });
                        
            if (err) return fail(400, { message: 'Something went wrong' });
            
            throw redirect(303, data.url);
        }
        else if (!body.email || !body.password) return fail(400, { message: 'Please fill in all fields' });
 
        const {data, error: err} = await supabaseClient.auth.signInWithPassword({
            email: body.email as string,
            password: body.password as string
        });

        if (err) {
            if (err instanceof AuthApiError && err.status === 400) return fail(400, { message: err.message });
            return fail(500, { message: err.message });
        }
        
        throw redirect(303, '/home');
    },
    signOut: async(event) => {
        const {supabaseClient} = await getSupabase(event);
        const { error: err } = await supabaseClient.auth.signOut();
        if (err) throw fail(500, {message: "Something went wrong logging you out."});
        throw redirect(303,'/sign-in');
    }
};