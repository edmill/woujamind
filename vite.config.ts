import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    assetsInlineLimit: (_filePath, content) =>
      content.length <= 2 * 1024 * 1024, // 2MB for other assets
  },
  // SECURITY: We do NOT inject API keys into the client bundle
  // Users provide their own API keys via Settings modal (stored in localStorage)
  // Development keys from .env are accessed via import.meta.env.VITE_* prefix only
})
