import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {

    if (event.params.id) event.params.id = Math.floor(Math.random() * (50000));
    
    const {supabaseClient} = await getSupabase(event);

    const { data, error } = await supabaseClient
    .from("puzzles")
    .select("*")
    .eq('id', event.params.id)
    .limit(1)
    .single();

    if (error) throw redirect(404);

    return {
        chessPuzzle: data as ChessPuzzle
    }
};