// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ChessGame } from "https://deno.land/x/chess@0.5.0/mod.ts";

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
            "https://oepoavgiwdswkdfigwsi.supabase.co",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcG9hdmdpd2Rzd2tkZmlnd3NpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3NTExNzAxMSwiZXhwIjoxOTkwNjkzMDExfQ.gCCV5XJ-xnbF-8xSvQR1NXVnAVio1g-HfRb5vgpcHZQ"
        );
        const invokerSupabaseClient = createClient(
            "https://oepoavgiwdswkdfigwsi.supabase.co",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcG9hdmdpd2Rzd2tkZmlnd3NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzUxMTcwMTEsImV4cCI6MTk5MDY5MzAxMX0.hUWLGXfRLmgLgVgyUDl3yBzLyOeRBAA60G0aGpm4rWg",
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

        // Get latest move from the FEN history
        const chess = ChessGame.NewFromFEN(chessGame.history[chessGame.history.length-1]);

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

        const playingColor = isPlayingWhite ? 'white' : 'black';
        const status = chess.getStatus();

        const hasTurn = playingColor === status.turn;
        if (!hasTurn) {
            return new Response(JSON.stringify({ error: 'Cannot move pieces when it is not your turn' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json'},
                status: 400,
            });
        }

        chess.move(move);

        chessGame.history.push(chess.toString('fen'));

        const updateChessGameRequest = await serviceRoleSupabaseClient
            .from("games")
            .update({ history: chessGame.history })
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
            console.error(error)
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
        });
    }
});

// To invoke:
// curl -i --location --request POST 'http://localhost:54321/functions/v1/' \
//   --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
//   --header 'Content-Type: application/json' \
//   --data '{"name":"Functions"}'
