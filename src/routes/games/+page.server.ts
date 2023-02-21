import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';

export const load = (async (event) => {;
    const {supabaseClient} = await getSupabase(event);
    if (!event.url.searchParams.get('page')) event.url.searchParams.set('page', "0");
    const pageNumber = event.url.searchParams.get('page') as number;
    const from = 0 + 8 * pageNumber;
    const to = 8 + 8 * pageNumber;

    const { data, count } = await supabaseClient
    .from("games")
    .select("*", { count: 'exact' })
    .range(from, to);
    
    return {    
        chessGames: data as ChessGame[],
        totalChessGameAmount: count
    }
}) satisfies PageServerLoad;