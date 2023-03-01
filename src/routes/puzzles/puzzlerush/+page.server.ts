import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    
    const {supabaseClient} = await getSupabase(event);

    const { data, error } = await supabaseClient
    .from("puzzles")
    .select("*")
    .lt('rating', 700)
    .returns<ChessPuzzle[]>();
        
    return {
        chessPuzzle: data[Math.floor(Math.random() * data.length)]
    }
};