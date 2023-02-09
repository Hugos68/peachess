import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import { fail } from "@sveltejs/kit";
import type { PageServerLoad } from './$types';

export const load = (async (event) => {
    const {params} = event;
    const {supabaseClient} = await getSupabase(event);

    const {error, data} =  await supabaseClient
    .from("games")
    .select("*")
    .eq('id', params.id)
    .limit(1)
    .single();

    if (error) return fail(404);
    
    return {
        chessRecord: data as ChessRecord
    }
}) satisfies PageServerLoad;