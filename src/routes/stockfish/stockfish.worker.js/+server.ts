import type { RequestHandler } from './$types';
import script from './stockfish.worker.js?raw';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.append('Content-Type', 'text/javascript');
    return new Response(script, { headers, status: 200 });
};