// apps/client/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      {
        find: '@tab-arcade/shared',
        replacement: path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      },
    ],
  },
  server: {
    port: 3000,
    // Proxy removed — socket connects directly to :4000
  },
})