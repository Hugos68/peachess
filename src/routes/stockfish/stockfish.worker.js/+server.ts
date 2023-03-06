import type { RequestHandler } from './$types';
import fs from 'fs';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Content-Type', 'text/javascript');
    return new Response(fs.readFileSync('/stockfish-files/stockfish.worker.js'), { headers, status: 200 });
};