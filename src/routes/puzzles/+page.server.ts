import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {

    const {supabaseClient} = await getSupabase(event);
    
    const randomPuzzleID = Math.floor(Math.random() * (50000));
    const { data } = await supabaseClient
    .from("puzzles")
    .select("*")
    .eq('id', randomPuzzleID)
    .limit(1)
    .single();

    const randomChessPuzzle = data as ChessPuzzle;

    return {
        chessPuzzle: randomChessPuzzle
    }
};