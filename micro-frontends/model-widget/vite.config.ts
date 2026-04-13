import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/widget/',
  server: {
    port: 5173,
    proxy: {
      '/api/models': {
        target: process.env.LLM_AGGREGATOR_URL ?? 'http://localhost:4001',
        rewrite: (path) => path.replace(/^\/api\/models/, '/models'),
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
