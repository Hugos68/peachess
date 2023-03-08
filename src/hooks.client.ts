import "$lib/supabase";

import type { Handle } from "@sveltejs/kit";
import { sequence } from '@sveltejs/kit/hooks';
import { getSupabase } from "@supabase/auth-helpers-sveltekit";

const authRoutes: string[] = ['/home', '/account'];
const antiAuthRoutes: string[] = ['/sign-in', '/sign-up'];

const handleAuthRouting: Handle = async ({ event, resolve }) => {
    const { session } = await getSupabase(event);
    const url: URL = new URL(event.request.url);
    const loggedIn: boolean = session!==null;
    const path: string = event.route.id;

    if (!loggedIn && authRoutes.includes(path)) {
        url.pathname = '/sign-in'
        return Response.redirect(url.toString(), 302);
    }
    else if (loggedIn && antiAuthRoutes.includes(path)) {
        url.pathname = '/home'
        return Response.redirect(url.toString(), 302);
    }
    
    return await resolve(event)
}

export const handle = sequence(handleAuthRouting);   