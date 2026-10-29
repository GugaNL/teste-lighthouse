const mongoose = require('mongoose');
const app = require('./app');
const config = require('./app/config/config');
const database = require('./infra/database/mongo');
const { seedIfEmpty } = require('./infra/seed');

const PRAZO_PARA_ENCERRAR_MS = 10_000;

database.connect();

const server = app.listen(config.port, () => {
  console.log(`[server] ${config.produto} — API na porta ${config.port}`);
  console.log(`[server] Documentação: http://localhost:${config.port}/docs`);
});

if (config.seedOnStart) {
  const semear = () => seedIfEmpty().catch((e) => console.error('[seed] Falhou:', e.message));
  if (mongoose.connection.readyState === 1) semear();
  else mongoose.connection.once('open', semear);
}

let encerrando = false;

function encerrar(sinal) {
  if (encerrando) return;
  encerrando = true;
  console.log(`[server] ${sinal} recebido — encerrando…`);

  const forcar = setTimeout(() => {
    console.error('[server] Encerramento demorou demais — saindo à força.');
    process.exit(1);
  }, PRAZO_PARA_ENCERRAR_MS);
  forcar.unref();

  server.close(async (erro) => {
    try {
      await database.disconnect();
      console.log('[server] Encerrado.');
      process.exit(erro ? 1 : 0);
    } catch (falha) {
      console.error('[server] Falha ao fechar o banco:', falha.message);
      process.exit(1);
    }
  });
  server.closeIdleConnections?.();
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));
