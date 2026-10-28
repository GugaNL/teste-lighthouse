const mongoose = require('mongoose');
const config = require('../../../app/config/config');

const ESPERA_ENTRE_TENTATIVAS_MS = 3000;

class Database {
  constructor() {
    this.connect();
  }

  /**
   * Conecta e, se o banco ainda não estiver no ar, tenta de novo.
   *
   * O Mongoose não refaz a conexão INICIAL sozinho — só reconecta depois de já
   * ter conectado uma vez. Sem isto, subir API e banco juntos (`npm run dev`
   * na raiz, ou um container que demora) deixaria a API viva e sem banco.
   */
  connect() {
    mongoose.set('strictQuery', true);
    return mongoose
      .connect(config.mongoUrl, { serverSelectionTimeoutMS: 5000 })
      .then(() => {
        if (config.nodeEnv !== 'test') console.log('[db] MongoDB conectado');
      })
      .catch((error) => {
        console.error('[db] Falha ao conectar no MongoDB:', error.message);
        if (config.nodeEnv === 'test') return;
        console.error(`[db] Nova tentativa em ${ESPERA_ENTRE_TENTATIVAS_MS / 1000}s…`);
        setTimeout(() => this.connect(), ESPERA_ENTRE_TENTATIVAS_MS);
      });
  }

  disconnect() {
    return mongoose.connection.close();
  }
}

module.exports = new Database();
