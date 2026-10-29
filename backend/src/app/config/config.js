const path = require('path');
const dotenv = require('dotenv');

// Caminho absoluto: o .env é sempre o da pasta backend, de onde quer que o
// processo tenha sido iniciado (raiz do monorepo, Docker, IDE).
// Em teste o helper define as variáveis antes de carregar o app.
if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
}

const nodeEnv = process.env.NODE_ENV || 'development';

// Em produção o banco é obrigatório — sem fallback silencioso para localhost.
if (nodeEnv === 'production' && !process.env.MONGO_URL) {
  throw new Error('Variável de ambiente obrigatória ausente: MONGO_URL');
}

module.exports = {
  port: Number(process.env.PORT) || 4008,
  nodeEnv,
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27022/catalogo-produtos',

  // Origens liberadas no CORS, separadas por vírgula. Em dev o Vite faz proxy
  // e nem precisa de CORS; isto vale para quem apontar outro front para a API.
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Popula o catálogo de demonstração quando a coleção está vazia (usado no
  // docker compose para a aplicação já subir com dados).
  seedOnStart: process.env.SEED_ON_START === 'true',

  produto: 'Catálogo de Produtos',
};
