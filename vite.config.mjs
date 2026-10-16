import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const pages = ['index', 'movies', 'series', 'details', 'favorites', 'watchlist'];

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, projectRoot, 'VITE_'), ...process.env };
  const key = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (key) {
    let isPublic = key.startsWith('sb_publishable_');
    try { isPublic ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon'; } catch {}
    if (!isPublic) throw new Error('O build aceita somente uma chave pública anon/publishable do Supabase.');
  }
  return {
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
  };
});
