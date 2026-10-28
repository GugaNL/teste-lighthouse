const BadRequest = require('../errors/BadRequest');

/**
 * Converte os detalhes do Joi num BadRequest com um item por campo.
 *
 * Um campo pode falhar em mais de uma regra ao mesmo tempo; fica só a primeira
 * mensagem de cada um, que é o que cabe embaixo de um input no formulário.
 */
const validationError = (error, mensagem = 'Verifique os campos destacados.') => {
  const porCampo = new Map();
  (error?.details || []).forEach((detalhe) => {
    const field = detalhe.path?.join('.') || detalhe.context?.key || 'body';
    if (!porCampo.has(field)) porCampo.set(field, detalhe.message.replace(/["]/g, ''));
  });
  const details = [...porCampo].map(([field, message]) => ({ field, message }));
  return new BadRequest(mensagem, details);
};

module.exports = { validationError };
