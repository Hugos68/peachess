import type { RequestHandler } from './$types';
import file from './stockfish.wasm?raw';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/wasm');
    return new Response(file, { headers, status: 200 });
};