/**
 * Corpo único de erro da API.
 *
 * As chaves são { statusCode, error, message, details }, sem `name` na raiz:
 * `name` é um campo do produto, e um erro com `name` confundiria quem consome
 * a API justamente no endpoint de produtos. Os erros de domínio carregam o
 * próprio statusCode e o serializer só os traduz.
 */
const serializeErrors = (erro) => {
  const statusCode = erro?.statusCode || 500;
  const corpo = {
    statusCode,
    error: erro?.error || 'Internal Server Error',
    // Erro inesperado não vaza mensagem interna (stack, driver do Mongo...).
    message: erro?.statusCode ? erro.message : 'Erro interno do servidor. Tente novamente.',
  };
  if (erro?.details?.length) corpo.details = erro.details;
  if (erro?.currentVersion !== undefined) corpo.currentVersion = erro.currentVersion;
  return corpo;
};

module.exports = { serializeErrors };
