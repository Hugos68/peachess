// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import jsChessEngine from "https://esm.sh/js-chess-engine@1.0.2";

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const { fen, AIDifficulity } = await req.json();

    try {

        const computedMove = jsChessEngine.aiMove(fen, AIDifficulity);

        const entry = Object.entries(computedMove)[0];

        return new Response(JSON.stringify({ message: 'Successfully generated ai move', move: {
            from: entry[0].toLowerCase(),
            to: entry[1].toLowerCase(),
            promotion: entry[2]
        } }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
        }); 
    }
});
