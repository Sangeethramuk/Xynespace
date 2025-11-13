import { defineConfig } from 'vite'
// no aliases currently
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Remove adapter alias; use native ECharts again
    }
  },
  // Serve static files from `public/`. We'll copy repo `assets/` → `public/assets` via npm scripts.
  publicDir: 'public',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    strictPort: false,
    host: true,
    open: true,
  },
  preview: {
    port: 5190,
    host: true,
  },
})
