import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const stockfishHeaderMiddleware = {
	name: 'log-request-middleware',
	configureServer(server) {
	  server.middlewares.use((req, res, next) => {
		res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
		res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
		next();
	  });
	}
  };

export default defineConfig({
	plugins: [stockfishHeaderMiddleware, sveltekit()]
});
