// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Chess, BLACK, WHITE } from "https://esm.sh/chess.js@1.0.0-beta.3";

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const { gameId, move } = await req.json();

    try {
        if (!gameId || !move) {
            return new Response(JSON.stringify({ error: 'gameId and/or move are undefined' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const serviceRoleSupabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '', 
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const invokerSupabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '', 
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        );

        const selectChessGameRequest = await serviceRoleSupabaseClient
            .from("games")
            .select("*")
            .eq('id', gameId)
            .limit(1)
            .single();
        
        const chessGame = selectChessGameRequest.data;
        const selectError = selectChessGameRequest.error;

        if (selectError) {
            return new Response(JSON.stringify({ error: selectError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const chess = new Chess();

        chess.loadPgn(chessGame.pgn);

        if (chess.isGameOver()) {
            return new Response(JSON.stringify({ error: 'Cannot move pieces of game that has ended' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const { data: { user } } = await invokerSupabaseClient.auth.getUser();

        const isPlayingWhite = chessGame.player_id_white === user.id;
        const isPlayingBlack = chessGame.player_id_black === user.id;
        const isPlaying = isPlayingWhite || isPlayingBlack;

        if (!isPlaying) {
            return new Response(JSON.stringify({ error: 'Cannot move pieces of game you arent participating in' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const playingColor = isPlayingWhite ? WHITE : BLACK;
   
        if (chess.turn() !== playingColor) {
            return new Response(JSON.stringify({ error: 'Cannot move pieces when it is not your turn' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json'},
                status: 400,
            });
        }

        // Throws error if move is illegal
        chess.move(move);

        // Set the result header when the game is over
        if (chess.isGameOver()) {
            if (chess.isCheckmate()) chess.turn() === BLACK ? chess.header('Result', '1-0') : chess.header('Result', '0-1');
            else chess.header('Result', '1/2-1/2');
        }

        const updateChessGameRequest = await serviceRoleSupabaseClient
            .from("games")
            .update({ pgn: chess.pgn() })
            .eq('id', gameId);

        const updatedChessGameError = updateChessGameRequest.error;

        if (updatedChessGameError) {
            return new Response(JSON.stringify({ error: updatedChessGameError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        return new Response(JSON.stringify({ message: 'Successfully executed move' }), {
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
