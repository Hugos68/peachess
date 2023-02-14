import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
    const {supabaseClient} = await getSupabase(event);

    const user = await supabaseClient.auth.getUser();

    if (!user.data.user) {
        return {
            chessGames: [] as ChessGame[]
        }
    } 

    console.log(user);

    const {data, error} = await supabaseClient
    .from("games")
    .select("*")
    .eq("player_id_black", user.data.user.id)
    .eq("player_id_white", user.data.user.id);

    console.log(data);
    

    return {
        chessGames: data as ChessGame[]
    }
}) satisfies PageServerLoad;