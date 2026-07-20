import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
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
    plugins: [react()],
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
