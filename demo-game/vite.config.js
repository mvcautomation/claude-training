import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build the React client into dist/. The standalone Node server (server/index.js)
// serves this dist/ AND handles WebSocket connections on the same origin.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
