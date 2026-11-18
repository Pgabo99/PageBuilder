import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Compose-ban az Nginx mögött fut: a böngésző az Nginx portján éri el a HMR-t.
    hmr: process.env.HMR_CLIENT_PORT ? { clientPort: Number(process.env.HMR_CLIENT_PORT) } : undefined,
    // Windowsos bind mounton a fájlváltozás-értesítések nem jutnak el a konténerbe.
    watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true } : undefined,
  },
})
