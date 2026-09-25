import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const pages = ['index', 'movies', 'series', 'details', 'favorites', 'watchlist'];

export default defineConfig({
  root: resolve(projectRoot, 'www'),
  envDir: projectRoot,
  base: './',
  appType: 'mpa',
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss({ config: resolve(projectRoot, 'tailwind.config.cjs') }), autoprefixer()] } },
  server: { fs: { allow: [projectRoot] } },
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    target: 'es2019',
    rollupOptions: {
      input: Object.fromEntries(pages.map(page => [page, resolve(projectRoot, 'www', page + '.html')]))
    }
  }
});
