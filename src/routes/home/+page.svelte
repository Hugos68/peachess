<script lang="ts">
    import ChessBoard from "$lib/components/ChessBoard.svelte";
    import { supabase } from "$lib/supabase";
    // TODO Get chess game and subscribe to it
</script>

<div class="mx-auto flex flex-col justify-center items-center gap-4">
    <ChessBoard sidePlaying="black" fenState="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" />
</div>