import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'robots.txt'],
      manifest: {
        name: 'Boursicot',
        short_name: 'Boursicot',
        description: 'Analyse fondamentale et graphiques boursiers',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#1a7878',
        lang: 'fr',
        icons: [
          { src: '/icons/icon-72x72.png',         sizes: '72x72',   type: 'image/png' },
          { src: '/icons/icon-96x96.png',         sizes: '96x96',   type: 'image/png' },
          { src: '/icons/icon-128x128.png',       sizes: '128x128', type: 'image/png' },
          { src: '/icons/icon-144x144.png',       sizes: '144x144', type: 'image/png' },
          { src: '/icons/icon-152x152.png',       sizes: '152x152', type: 'image/png' },
          { src: '/icons/icon-192x192.png',       sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-384x384.png',       sizes: '384x384', type: 'image/png' },
          { src: '/icons/icon-512x512.png',       sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/apple-touch-icon.png',   sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        // Stale-While-Revalidate pour les assets statiques
        runtimeCaching: [
          {
            // API : Network-First (données fraîches), fallback cache si offline
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Images / icônes : Cache-First (stable, long-term)
            urlPattern: /\/icons\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'icons-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          {
            // Assets JS/CSS : Stale-While-Revalidate
            urlPattern: /\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
  },
});
