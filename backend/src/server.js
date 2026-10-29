const mongoose = require('mongoose');
const app = require('./app');
const config = require('./app/config/config');
const { seedIfEmpty } = require('./infra/seed');

app.listen(config.port, () => {
  console.log(`[server] ${config.produto} — API na porta ${config.port}`);
  console.log(`[server] Documentação: http://localhost:${config.port}/docs`);
});

if (config.seedOnStart) {
  const semear = () => seedIfEmpty().catch((e) => console.error('[seed] Falhou:', e.message));
  if (mongoose.connection.readyState === 1) semear();
  else mongoose.connection.once('open', semear);
}
