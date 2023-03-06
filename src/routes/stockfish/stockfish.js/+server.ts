import type { RequestHandler } from './$types';
import fs from 'node:fs';
import { dev } from '$app/environment'; 

export const GET: RequestHandler = async () => {
    console.log(fs.readdirSync('.'));
    const headers = new Headers();
    headers.append('Content-Type', 'text/javascript');
    if (dev) return new Response(fs.readFileSync('./static/stockfish-files/stockfish.js'), { headers, status: 200 });
    else return new Response(fs.readFileSync('/stockfish-files/stockfish.js'), { headers, status: 200 });
};