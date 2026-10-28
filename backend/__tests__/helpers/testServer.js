/*
 * Infraestrutura de teste: sobe um MongoDB em memória e configura o ambiente
 * ANTES de carregar o app (config lê process.env no load).
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let app;
let mongoose;

async function start() {
  mongod = await MongoMemoryServer.create();

  process.env.NODE_ENV = 'test';
  process.env.MONGO_URL = mongod.getUri('codex-catalogo-test');
  // Aponta para uma pasta inexistente: os testes não dependem de o frontend
  // ter sido compilado nesta máquina.
  process.env.FRONTEND_DIR = '/nao-existe';

  app = require('../../src/app');
  mongoose = require('mongoose');
  await mongoose.connection.asPromise();
  // Os índices com collation precisam existir antes do primeiro teste.
  await mongoose.model('Product').syncIndexes();
  return app;
}

async function stop() {
  if (mongoose) await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clear() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

/** Produto válido — cada teste sobrescreve só o campo que quer exercitar. */
const produtoValido = (sobrescrever = {}) => ({
  name: 'Fone Bluetooth Pulse',
  description: 'Cancelamento de ruído ativo',
  price: 349.9,
  stock: 25,
  category: 'Eletrônicos',
  ...sobrescrever,
});

module.exports = { start, stop, clear, produtoValido };
