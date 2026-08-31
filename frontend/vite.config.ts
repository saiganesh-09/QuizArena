import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to the backend during development so cookies
      // are same-origin and credentials flow seamlessly. The frontend
      // sends requests to /api/* — we rewrite to strip the /api prefix
      // so the backend receives them at /auth/*, /admin/*, etc.
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Allow modern SCSS API usage if needed.
        api: 'modern-compiler',
      },
    },
  },
});
