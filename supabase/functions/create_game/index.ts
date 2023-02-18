// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Chess } from "https://esm.sh/chess.js@1.0.0-beta.3";

export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const { opponentUsername } = await req.json();

    try {
        if (!opponentUsername) {
            return new Response(JSON.stringify({ error: 'Opponent username is undefined' }), {
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

        const selectOpponentRequest = await serviceRoleSupabaseClient
            .from("profiles")
            .select("*")
            .eq('user_name', opponentUsername)
            .limit(1)
            .single();
        
        const opponent = selectOpponentRequest.data;
        const selectOpponentError = selectOpponentRequest.error;

        if (selectOpponentError) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const invokerId = (await invokerSupabaseClient.auth.getUser()).data.user.id;

        const selectInvokerRequest = await serviceRoleSupabaseClient
        .from("profiles")
        .select("*")
        .eq('id', invokerId)
        .limit(1)
        .single();
    
        const invoker = selectInvokerRequest.data;
        const selectInvokerError = selectInvokerRequest.error;

        if (selectInvokerError) {
            return new Response(JSON.stringify({ error: selectInvokerError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        if (invoker.id === opponent.id) {
            return new Response(JSON.stringify({ error: 'You cannot play a game against yourself'}), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }
        // TODO: Check if both are already in a game

        // Randomly decide side (50/50)
        let playerWhite;
        let playerBlack;
        if (Math.random() < 0.5){
            playerWhite = invoker;
            playerBlack = opponent;
        }
        else {
            playerWhite = opponent;
            playerBlack = invoker;
        }

        const chess = new Chess();

        chess.header('Event', 'Chess Game');
        chess.header('Site', 'https://peachess.vercel.app/');
        chess.header('Date', new Date());
        chess.header('Round', null)
        chess.header('White', playerWhite.user_name);
        chess.header('Black', playerBlack.user_name);
        chess.header('Result', '*');

        const {data, error} = await serviceRoleSupabaseClient
        .from('games')
        .insert([
            {
                player_id_white: playerWhite.id,
                player_id_black: playerBlack.id,
                pgn: chess.pgn()
            }
        ])
        .select()
        .limit(1)
        .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        return new Response(JSON.stringify({ message: 'Successfully created game', game: data }), {
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
