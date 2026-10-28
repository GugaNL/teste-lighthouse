import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const API_PATHS = ['/products', '/categories', '/health', '/docs'];

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:4008';

  return {
    plugins: [react()],
    css: {
      preprocessorOptions: { scss: { api: 'modern' } },
    },
    server: {
      host: true,
      port: 5181,
      strictPort: true,
      proxy: Object.fromEntries(API_PATHS.map((caminho) => [caminho, proxyTarget])),
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      css: false,
    },
  };
});
