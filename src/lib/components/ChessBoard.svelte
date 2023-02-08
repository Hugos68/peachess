<script lang="ts">
    import { Chess } from 'chess.js'
    export let fenState: string;
    const chess = new Chess(fenState);
    const board = chess.board();
    console.log(board);
</script>

<table class="card w-[min(75vw,35rem)] aspect-square mx-auto border-collapse">
    <tbody>
        <tr>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
        </tr>
        <tr>

            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
        </tr>
        <tr>
    
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
        </tr>
        <tr>
     
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
        </tr>
        <tr>
   
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
        </tr>
        <tr>
  
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
        </tr>
        <tr>
     
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
        </tr>
        <tr>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-dark-color)] relative"></td>
            <td class="w-[12.5%] aspect-square bg-[var(--chess-light-tile-color)] relative"></td>
        </tr>
    </tbody>
</table>