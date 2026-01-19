import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Hono SQLite App',
        short_name: 'HonoApp',
        description: 'Ultra-fast Fullstack App with Bun & Hono',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true
      },
      workbox: {
        // Verhindert, dass API-Calls gecacht werden
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*$/,
            handler: 'NetworkOnly', // API immer vom Server laden
          },
        ],
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
})
