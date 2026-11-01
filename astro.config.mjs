import { defineConfig } from 'astro/config';

export default defineConfig({
  // Relative asset URLs so the built site works from any folder or preview host.
  base: './',
  build: { assets: 'assets', format: 'file' },
  vite: { build: { assetsInlineLimit: 0 } },
});
