import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
    const {supabaseClient} = await getSupabase(event);
    
    const {error, data} = await supabaseClient
    .from("games")
    .select("*")
    .eq("id", event.params.id)
    .limit(1)
    .single();

    if (error) throw redirect(303, `/games?${new URLSearchParams({message: 'The game you tried to visit does not exist'})}`);

    return {
        chessGame: data as OnlineChessGame
    }
}) satisfies PageServerLoad;