import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Root deployment (Cloudflare Pages *.pages.dev, or a custom domain): keep '/'.
// GitHub Pages project site (username.github.io/plate-watch/): set base to '/plate-watch/'.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
