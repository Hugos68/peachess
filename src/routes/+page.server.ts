import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import { AuthApiError } from "@supabase/supabase-js";
import { fail, type Actions, redirect } from "@sveltejs/kit";

export const actions: Actions = {
    signUp: async(event) => {
        const {request} = event;
        const body = Object.fromEntries(await request.formData());

        if (body.password!==body.confirmPassword) return fail(400, { message: 'Password mismatch' });
         
        if (!body.username || !body.email || !body.password) return fail(400, { message: 'Please fill in all fields' });

        if (body.username.length < 4 || body.username.length > 20) return fail(400, { message: 'Username must be between 4 and 20 characteres long' });
        
        const {supabaseClient} = await getSupabase(event);
        
        const {error: err, data}  = await supabaseClient.auth.signUp({
            email: body.email as string,
            password: body.password as string,
            options: {
                data: {
                    user_name: body.username
                }
            }
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

        throw redirect(303, '/sign-in');
    },
    signIn: async(event) => {
        const {request, url} = event;
        const body = Object.fromEntries(await request.formData());

        const {supabaseClient} = await getSupabase(event);

        if (!body.email || !body.password) return fail(400, { message: 'Please fill in all fields' });
 
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