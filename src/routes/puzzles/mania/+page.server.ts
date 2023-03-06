import { getSupabase } from "@supabase/auth-helpers-sveltekit";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
    
    const {supabaseClient} = await getSupabase(event);

    const { data, error } = await supabaseClient.rpc('get_random_puzzle', {
        low_rating: 600,
        high_rating: 700,
    }); 

    return {
        chessPuzzle: data as chessPuzzle
    }
};