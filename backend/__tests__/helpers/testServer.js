const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let app;
let mongoose;

async function start({ frontendDir = '/nao-existe', mongodArgs = [] } = {}) {
  mongod = await MongoMemoryServer.create({ instance: { args: mongodArgs } });

  process.env.NODE_ENV = 'test';
  process.env.MONGO_URL = mongod.getUri('catalogo-produtos-test');
  process.env.FRONTEND_DIR = frontendDir;

  app = require('../../src/app');
  mongoose = require('mongoose');
  await require('../../src/infra/database/mongo').connect();
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
