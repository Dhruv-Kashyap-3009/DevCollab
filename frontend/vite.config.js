import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Local dev keeps the historical localhost:3000 target. Inside Docker the
// backend is reachable by its compose service name, so compose sets this.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Polling is opt-in (compose sets CHOKIDAR_USEPOLLING) so Docker bind
    // mounts on Windows pick up file edits reliably.
    watch: process.env.CHOKIDAR_USEPOLLING === 'true' ? { usePolling: true } : undefined,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/ws': {
        target: apiTarget.replace(/^http/, 'ws'),
        ws: true,
      },
    },
  }
})
