export function middleware(request: Request) {
    request.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    request.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    
    // Return response
    return request
}