const HttpError = require('../errors/HttpError');
const { serializeErrors } = require('../serialize/errorSerialize');

const respondWithError = (res, erro) => {
  if (!(erro instanceof HttpError)) console.error('[erro]', erro);
  const corpo = serializeErrors(erro);
  return res.status(corpo.statusCode).json(corpo);
};

module.exports = { respondWithError };
