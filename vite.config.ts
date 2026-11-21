import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    allowedHosts: ['pv-6eb10d6c8f60-a965d78a-e2a5-4a5d-a528-6e19cd50e7b1.style.dev'],
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1200,
  },
})
