const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let app;
let mongoose;

async function start() {
  mongod = await MongoMemoryServer.create();

  process.env.NODE_ENV = 'test';
  process.env.MONGO_URL = mongod.getUri('catalogo-produtos-test');
  process.env.FRONTEND_DIR = '/nao-existe';

  app = require('../../src/app');
  mongoose = require('mongoose');
  await mongoose.connection.asPromise();
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

const produtoValido = (sobrescrever = {}) => ({
  name: 'Fone Bluetooth Pulse',
  description: 'Cancelamento de ruído ativo',
  price: 349.9,
  stock: 25,
  category: 'Eletrônicos',
  ...sobrescrever,
});

module.exports = { start, stop, clear, produtoValido };
