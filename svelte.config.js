import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';
import importAssets from 'svelte-preprocess-import-assets'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	},
	preprocess: [
		vitePreprocess({
			postcss: true
		}),
		importAssets()
	],
};

export default config;
