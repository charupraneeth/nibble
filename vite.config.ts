import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { VitePWA } from 'vite-plugin-pwa'

console.log('Build Environment Variables:', Object.keys(process.env).filter(key => key.startsWith('VITE_')))


export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Nibble - AI Nutrition Tracker',
        short_name: 'Nibble',
        description: 'Track your nutrition with AI',
        theme_color: '#ffffff',
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
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
