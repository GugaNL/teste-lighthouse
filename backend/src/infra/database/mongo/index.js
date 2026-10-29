const mongoose = require('mongoose');
const config = require('../../../app/config/config');
const logger = require('../../../app/helpers/logger');

const ESPERA_ENTRE_TENTATIVAS_MS = 3000;

class Database {
  connect() {
    mongoose.set('strictQuery', true);
    return mongoose
      .connect(config.mongoUrl, { serverSelectionTimeoutMS: 5000 })
      .then(() => logger.info('MongoDB conectado'))
      .catch((error) => {
        logger.error({ err: error }, 'Falha ao conectar no MongoDB');
        if (config.nodeEnv === 'test') throw error;
        logger.warn(`Nova tentativa de conexão em ${ESPERA_ENTRE_TENTATIVAS_MS / 1000}s`);
        return new Promise((resolve) => {
          setTimeout(() => resolve(this.connect()), ESPERA_ENTRE_TENTATIVAS_MS);
        });
      });
  }

  disconnect() {
    return mongoose.connection.close();
  }
}

module.exports = new Database();
