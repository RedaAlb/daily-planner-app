import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';
import path from 'path';
import os from 'os';

function getBuildVersionInfo(env) {
  const runGit = (cmd) => {
    try {
      return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch {
      return '';
    }
  };

  const rawSha = env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || runGit('git rev-parse HEAD');
  const commitSha = rawSha ? rawSha.slice(0, 7) : 'unknown';
  const branch =
    env.VERCEL_GIT_COMMIT_REF ||
    process.env.VERCEL_GIT_COMMIT_REF ||
    runGit('git rev-parse --abbrev-ref HEAD') ||
    'unknown';
  const buildTime = new Date().toISOString();

  return { commitSha, branch, buildTime };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const processEnv = {};
  for (const key in env) {
    if (key.startsWith('REACT_APP_')) {
      processEnv[key] = env[key];
    }
  }
  const buildVersion = getBuildVersionInfo(env);

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
      'process.env': processEnv,
      __APP_COMMIT_SHA__: JSON.stringify(buildVersion.commitSha),
      __APP_BRANCH__: JSON.stringify(buildVersion.branch),
      __APP_BUILD_TIME__: JSON.stringify(buildVersion.buildTime)
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
