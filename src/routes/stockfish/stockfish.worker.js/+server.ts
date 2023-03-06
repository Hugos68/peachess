import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    const headers = new Headers();
    headers.append('Content-Type', 'text/javascript');
    const response = await event.fetch('/stockfish-files/stockfish.worker.js');
    return new Response(await response.text(), { headers, status: 200 });
};