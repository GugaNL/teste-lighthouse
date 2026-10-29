const BadRequest = require('../errors/BadRequest');

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
