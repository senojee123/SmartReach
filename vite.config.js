import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true
      }
    }
  }
})

