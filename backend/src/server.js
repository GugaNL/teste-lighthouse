const app = require('./app');
const config = require('./app/config/config');
const logger = require('./app/helpers/logger');
const database = require('./infra/database/mongo');
const { productRepository } = require('./app/repository/ProductRepository');
const { seedIfEmpty } = require('./infra/seed');

const PRAZO_PARA_ENCERRAR_MS = 10_000;

const server = app.listen(config.port, () => {
  logger.info(`${config.produto} — API na porta ${config.port}`);
  logger.info(`Documentação: http://localhost:${config.port}/docs`);
});

database
  .connect()
  .then(async () => {
    const migrados = await productRepository.migratePriceToCents();
    if (migrados) logger.info(`Preço convertido para centavos em ${migrados} produtos.`);
    if (config.seedOnStart) await seedIfEmpty();
  })
  .catch((erro) => logger.error({ err: erro }, 'Falha ao preparar o banco'));

let encerrando = false;

function encerrar(sinal) {
  if (encerrando) return;
  encerrando = true;
  logger.info(`${sinal} recebido — encerrando…`);

  const forcar = setTimeout(() => {
    logger.error('Encerramento demorou demais — saindo à força.');
    process.exit(1);
  }, PRAZO_PARA_ENCERRAR_MS);
  forcar.unref();

  server.close(async (erro) => {
    try {
      await database.disconnect();
      logger.info('Encerrado.');
      process.exit(erro ? 1 : 0);
    } catch (falha) {
      logger.error({ err: falha }, 'Falha ao fechar o banco');
      process.exit(1);
    }
  });
  server.closeIdleConnections?.();
}

process.on('SIGTERM', () => encerrar('SIGTERM'));
process.on('SIGINT', () => encerrar('SIGINT'));
