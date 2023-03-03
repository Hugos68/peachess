import type { RequestHandler } from './$types';
import file from './stockfish.js?raw';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.append('Cross-Origin-Opener-Policy', 'same-origin');
    headers.append('Content-Type', 'text/javascript');
    return new Response(file, { headers, status: 200 });
};