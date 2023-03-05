import type { RequestHandler } from './$types';
import fs from 'fs';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/wasm');
    return new Response(fs.readFileSync('src/routes/stockfish/stockfish.wasm/stockfish.wasm'), { headers, status: 200 });
};