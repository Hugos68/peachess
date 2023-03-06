import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/wasm');
    const response = await event.fetch('/stockfish-files/stockfish.wasm');
    return new Response(await response.arrayBuffer(), { headers, status: 200 });
};