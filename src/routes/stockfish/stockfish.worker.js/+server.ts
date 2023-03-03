import type { RequestHandler } from './$types';
import file from './stockfish.worker.js?raw';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Content-Type', 'text/javascript');
    return new Response(file, { headers, status: 200 });
};