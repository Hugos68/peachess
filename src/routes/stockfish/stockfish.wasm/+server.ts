import type { RequestHandler } from './$types';
import fs from 'node:fs';
import path from 'node:path';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/wasm');
    const stockfishPath = path.resolve(PUBLIC_SRV_ROOT, '/stockfish-files/stockfish.wasm')
    return new Response(fs.readFileSync(stockfishPath), { headers, status: 200 });
};