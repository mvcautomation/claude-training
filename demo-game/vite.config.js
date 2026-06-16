import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    // Local dev: proxy the websocket to the standalone Node server (run `npm run start` in another tab)
    proxy: {
      '/parties': {
        target: 'ws://localhost:3200',
        ws: true,
      },
    },
  },
})
