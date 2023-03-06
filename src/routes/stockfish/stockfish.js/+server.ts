import type { RequestHandler } from './$types';
import fs from 'node:fs';
import path from 'node:path';
import { PUBLIC_SRV_ROOT } from '$env/static/public';

export const GET: RequestHandler = async () => 
    const headers = new Headers();
    headers.append('Content-Type', 'text/javascript');
    const stockfishPath = path.resolve(PUBLIC_SRV_ROOT, '/stockfish-files/stockfish.js')
    return new Response(fs.readFileSync(stockfishPath), { headers, status: 200 });
};