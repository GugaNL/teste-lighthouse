/*
 * MongoDB local para desenvolvimento, sem instalar servidor nem Docker.
 * Dados persistem em backend/.localdb.
 *
 * Uso: `npm run db` (deixe rodando em um terminal).
 * Na primeira execução o mongodb-memory-server baixa o binário do mongod.
 */
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const PORT = Number(process.env.LOCAL_DB_PORT || 27022);
const dbPath = path.join(__dirname, '..', '.localdb');

(async () => {
  fs.mkdirSync(dbPath, { recursive: true });

  const mongod = await MongoMemoryServer.create({
    instance: { port: PORT, dbPath, storageEngine: 'wiredTiger' },
  });

  console.log(`[db] MongoDB local em ${mongod.getUri()}catalogo-produtos`);
  console.log('[db] Ctrl+C para parar.');

  const parar = async () => {
    await mongod.stop();
    process.exit(0);
  };
  process.on('SIGINT', parar);
  process.on('SIGTERM', parar);
})();
