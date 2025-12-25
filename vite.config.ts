import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'auto',
          workbox: {
            cleanupOutdatedCaches: true,
            globPatterns: ['**/*.{js,html,svg}']
          },
          includeAssets: ['mask-icon.svg'],
          manifest: {
            name: 'Maa Care - Pregnancy Companion',
            short_name: 'Maa Care',
            description: 'Your AI-powered pregnancy companion for health tracking, food safety, and support.',
            theme_color: '#ec4899',
            background_color: '#fdf2f8',
            display: 'standalone',
            display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
            orientation: 'portrait',
            start_url: '.',
            scope: '/',
            id: 'com.maacare.app',
            icons: [
              {
                src: 'mask-icon.svg',
                sizes: '144x144',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: 'mask-icon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: 'mask-icon.svg',
                sizes: '192x192',
                type: 'image/svg+xml',
                purpose: 'maskable'
              },
              {
                src: 'mask-icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any'
              },
              {
                src: 'mask-icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'maskable'
              }
            ]
          },
          devOptions: {
            enabled: true
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
