import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageLoad } from './$types';

export const load = (async (event) => {
    const {supabaseClient} = await getSupabase(event);
    
    const user = await supabaseClient.auth.getUser();
    
    const {data} = await supabaseClient
    .from("games")
    .select("*")
    .or(`player_id_black.eq.${user.data.user.id},player_id_black.eq.${user.data.user.id}`)
    .order('created_at', { ascending: false});

    return {
        chessGames: data as OnlineChessGame[]
    }
}) satisfies PageLoad;