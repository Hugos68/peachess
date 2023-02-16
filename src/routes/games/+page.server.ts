import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';
import { redirect} from '@sveltejs/kit';

export const load = (async (event) => {;
    const {supabaseClient} = await getSupabase(event);

    event.depends('app:games');

    const {data, error} = await supabaseClient
    .from("games")
    .select("*");
    
    return {
        chessGames: data as ChessGame[]
    }
}) satisfies PageServerLoad;