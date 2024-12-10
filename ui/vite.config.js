import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', 
  build: {
    outDir: 'dist',
    target: 'electron16', 
  },
  plugins: [react()],
  server: {
    port: 3000,  
  },
})
