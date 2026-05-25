import { defineConfig } from 'vite';

// Browser hits same-origin /api; Vite forwards to Nest (avoids CORS "Failed to fetch").
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:3000';

const apiProxy = {
  '/api': {
    target: proxyTarget,
    changeOrigin: true,
  },
};

// Allow Cloudflare Tunnel hostnames so external testers can reach the dev server.
// Vite 5.4+ honours `server.allowedHosts`; on older 5.x this is silently ignored.
// `.workers.dev` covers the Cloudflare Worker reverse-proxy described in
// app/CLOUDFLARE_WORKER_PROXY.md — defence-in-depth in case anything ever
// forwards the workers.dev Host header instead of the trycloudflare one.
const tunnelHosts = [
  'localhost',
  '127.0.0.1',
  '.trycloudflare.com',
  '.cfargotunnel.com',
  '.workers.dev',
];

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: tunnelHosts,
    proxy: apiProxy,
  },
  preview: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: tunnelHosts,
    proxy: apiProxy,
  },
  build: {
    outDir: 'dist-psynova',
    emptyOutDir: true,
  },
});
