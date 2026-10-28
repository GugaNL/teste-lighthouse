import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// A API não tem prefixo (as rotas são /products, como pede o desafio), então
// cada recurso entra no proxy do servidor de dev.
const API_PATHS = ['/products', '/categories', '/health', '/docs'];

export default defineConfig(({ mode }) => {
  // Lê frontend/.env também para variáveis sem prefixo VITE_ usadas só aqui.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  // Em dev aponta para o backend local; dentro do Docker, para o serviço.
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
      globals: true,
      setupFiles: './src/test/setup.js',
      css: false,
    },
  };
});
