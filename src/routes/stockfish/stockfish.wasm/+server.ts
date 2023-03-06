import type { RequestHandler } from './$types';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const GET: RequestHandler = async () => {
    const headers = new Headers();
    headers.append('Content-Type', 'application/wasm');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return new Response(fs.readFileSync(__dirname + '\\stockfish.wasm'), { headers, status: 200 });
};