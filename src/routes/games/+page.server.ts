import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async (event) => {
    const {supabaseClient} = await getSupabase(event);

    const userId = await supabaseClient.auth.getUser().data.user.id;

    const {data, error} = await supabaseClient
    .from("games")
    .select("*")
    .eq("player_id_black", userId)
    .eq("player_id_white", userId);

    console.log(data);
    

    return {
        chessGame: data as ChessGame[]
    }
}) satisfies PageServerLoad;