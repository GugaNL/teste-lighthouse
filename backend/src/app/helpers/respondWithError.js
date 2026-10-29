const HttpError = require('../errors/HttpError');
const { serializeErrors } = require('../serialize/errorSerialize');
const logger = require('./logger');

const respondWithError = (res, erro) => {
  if (!(erro instanceof HttpError)) (res.req?.log ?? logger).error({ err: erro }, 'Erro inesperado');
  const corpo = serializeErrors(erro);
  return res.status(corpo.statusCode).json(corpo);
};

module.exports = { respondWithError };
