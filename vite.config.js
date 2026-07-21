import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import os from 'os';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const processEnv = {};
  for (const key in env) {
    if (key.startsWith('REACT_APP_')) {
      processEnv[key] = env[key];
    }
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifestFilename: 'manifest.json',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.png'],
        manifest: {
          short_name: "Daily Planner",
          name: "Daily Planner",
          description: "A clean, modern daily planner app to track tasks, routines, and progress.",
          icons: [
            {
              src: "favicon.ico",
              sizes: "64x64 32x32 24x24 16x16",
              type: "image/x-icon"
            },
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            }
          ],
          start_url: "/",
          display: "standalone",
          theme_color: "#af8d67",
          background_color: "#ffffff"
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],
    cacheDir: path.join(os.tmpdir(), 'vite-cache-daily-planner-app'),
    define: {
      'process.env': processEnv
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
      css: true,
    },
    server: {
      port: 3000,
    }
  };
});
