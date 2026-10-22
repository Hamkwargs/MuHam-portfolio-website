
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',

  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,

    rollupOptions: {
      input: {
        portfolio: resolve(__dirname, 'index.html'),
        titleStudio: resolve(__dirname, 'title.html')
      }
    }
  }
});
