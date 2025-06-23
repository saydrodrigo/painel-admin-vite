import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 2000,
    hmr: {
      protocol: 'ws',
      host: 'terrorapp.ddns.net',
      port: 2000,
    },
  },
})
