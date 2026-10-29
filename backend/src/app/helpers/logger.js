const pino = require('pino');
const config = require('../config/config');

const temPinoPretty = () => {
  try {
    require.resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
};

const logger = pino({
  level: config.logLevel,
  transport:
    config.nodeEnv === 'development' && temPinoPretty()
      ? {
          target: 'pino-pretty',
          options: { translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,req,res,responseTime' },
        }
      : undefined,
});

module.exports = logger;
