const HttpError = require('../errors/HttpError');

const serializeErrors = (erro) => {
  if (!(erro instanceof HttpError)) {
    return {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Erro interno do servidor. Tente novamente.',
    };
  }
  const corpo = { statusCode: erro.statusCode, error: erro.error, message: erro.message };
  if (erro.details) corpo.details = erro.details;
  if (erro.currentVersion !== undefined) corpo.currentVersion = erro.currentVersion;
  return corpo;
};

module.exports = { serializeErrors };
