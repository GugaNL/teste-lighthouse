const path = require('path');
const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'test') {
  dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });
}

const nodeEnv = process.env.NODE_ENV || 'development';

if (nodeEnv === 'production' && !process.env.MONGO_URL) {
  throw new Error('Variável de ambiente obrigatória ausente: MONGO_URL');
}

module.exports = {
  port: Number(process.env.PORT) || 4008,
  nodeEnv,
  mongoUrl: process.env.MONGO_URL || 'mongodb://127.0.0.1:27022/catalogo-produtos',

  corsOrigin: process.env.CORS_ORIGIN || '*',

  seedOnStart: process.env.SEED_ON_START === 'true',

  produto: 'Catálogo de Produtos',
};
