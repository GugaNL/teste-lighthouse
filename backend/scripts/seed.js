const mongoose = require('mongoose');
const config = require('../src/app/config/config');
const { seed } = require('../src/infra/seed');

(async () => {
  try {
    await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 5000 });
    const total = await seed();
    console.log(`[seed] ${total} produtos criados em ${config.mongoUrl}`);
  } catch (erro) {
    console.error('[seed] Falhou:', erro.message);
    console.error('[seed] O MongoDB está no ar? Em dev, rode `npm run db` em outro terminal.');
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
