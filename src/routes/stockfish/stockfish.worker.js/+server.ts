import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Content-Type', 'text/javascript');
    const stockfishPath = path.resolve(PUBLIC_SRV_ROOT, '/stockfish-files/stockfish.js')
    return new Response(fs.readFileSync(stockfishPath), { headers, status: 200 });
};