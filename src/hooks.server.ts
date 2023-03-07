import "$lib/supabase";

import type { Handle } from "@sveltejs/kit";
import { sequence } from '@sveltejs/kit/hooks';
import { getSupabase } from "@supabase/auth-helpers-sveltekit";

const handleWasmHeaders: Handle = async ({ event, resolve }) => {
    const response = await resolve(event);
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return response;
}

const authRoutes: string[] = ['/home', '/account'];

const handleAuthRouting: Handle = async ({ event, resolve }) => {
    const { session } = await getSupabase(event);
    const url: URL = new URL(event.request.url);
    const loggedIn: boolean = session!==null;
    
    if (!loggedIn && authRoutes.includes(event.route.id)) {
        url.pathname = '/sign-in'
        return Response.redirect(url.toString(), 302);
    }
    
    return await resolve(event)
}

export const handle = sequence(handleAuthRouting, handleWasmHeaders);   