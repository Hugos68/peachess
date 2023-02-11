import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const {supabaseClient} = await getSupabase(event);
    
    const {error, data} = await supabaseClient
    .from("games")
    .select("*")
    .eq("id", event.params.id as number)
    .limit(1)
    .single();

    return {
        chessGame: data as ChessGame
    }
}) satisfies PageServerLoad;