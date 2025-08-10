import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/rallyiq/app/',                    // <— mude a base
  build: { outDir: '../docs/app', emptyOutDir: true }, // <— gera em docs/app
})
