import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';

export const load = (async () => {
    const {supabaseClient} = await getSupabase(event);
    
    const {error, data} = await supabaseClient
    .from("games")
    .select("*");
    console.log(data);
    
    return {
        chessGames: data as ChessGame[]
    }
}) satisfies PageServerLoad;