const { randomUUID } = require('crypto');
const pinoHttp = require('pino-http');
const logger = require('./logger');

const ID_VALIDO = /^[\w.-]{1,100}$/;

module.exports = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const recebido = req.headers['x-request-id'];
    const id = typeof recebido === 'string' && ID_VALIDO.test(recebido) ? recebido : randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  autoLogging: { ignore: (req) => req.url === '/health' },
  customLogLevel: (req, res, erro) => {
    if (erro || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, ms) => `${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`,
  customErrorMessage: (req, res) => `${req.method} ${req.originalUrl} ${res.statusCode}`,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
});
