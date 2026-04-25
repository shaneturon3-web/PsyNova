import { defineConfig } from 'vite';

// Browser hits same-origin /api; Vite forwards to Nest (avoids CORS "Failed to fetch").
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000';

const apiProxy = {
  '/api': {
    target: proxyTarget,
    changeOrigin: true,
  },
};

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
  },
  preview: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
  },
  build: {
    outDir: 'dist-psynova',
    emptyOutDir: true,
  },
});
