import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'ESchedular26',
        short_name: 'ESchedular',
        description: 'University Scheduling and Lab Tracker App',
        theme_color: '#202124',
        background_color: '#202124',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  base: './',
  server: {
    watch: {
      ignored: ['**/*.pdf']
    }
  }
});
