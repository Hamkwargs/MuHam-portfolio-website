import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages: ตั้ง base เป็น '/<repo-name>/' ตอน deploy (หรือใช้ env)
  base: process.env.BASE_PATH ?? '/',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
