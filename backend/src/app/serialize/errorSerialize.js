/**
 * Corpo único de erro da API.
 *
 * O padrão Codex usa { description, name }. Aqui as chaves mudaram para
 * { statusCode, error, message, details } porque `name` é um campo do produto —
 * um erro com `name` na raiz confundiria quem consome a API justamente no
 * endpoint de produtos. O resto do contrato é o mesmo: os erros de domínio
 * carregam o próprio statusCode e o serializer só os traduz.
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
