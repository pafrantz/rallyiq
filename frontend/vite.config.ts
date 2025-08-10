import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Ajuste `base` para "/NOME_DO_REPO/" se publicar em subpasta do GitHub Pages
export default defineConfig({ plugins:[react()], base: '/rallyiq/' })
