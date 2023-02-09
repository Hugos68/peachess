import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const {supabaseClient} = await getSupabase(event);

    const {error, data} =  await supabaseClient
    .from("games")
    .select("*");

    if (error) return fail(404);
    
    return {
        chessRecords: data as ChessRecord[]
    }
}) satisfies PageServerLoad;