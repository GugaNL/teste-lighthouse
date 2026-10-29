const serializeErrors = (erro) => {
  const statusCode = erro?.statusCode || 500;
  const corpo = {
    statusCode,
    error: erro?.error || 'Internal Server Error',
    message: erro?.statusCode ? erro.message : 'Erro interno do servidor. Tente novamente.',
  };
  if (erro?.details?.length) corpo.details = erro.details;
  if (erro?.currentVersion !== undefined) corpo.currentVersion = erro.currentVersion;
  return corpo;
};

module.exports = { serializeErrors };
