const BadRequest = require('../errors/BadRequest');
const { respondWithError } = require('../helpers/respondWithError');

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const MENSAGEM = 'ID inválido — deve ter 24 caracteres hexadecimais.';

module.exports = (req, res, next) => {
  if (OBJECT_ID.test(req.params.id)) return next();
  return respondWithError(res, new BadRequest(MENSAGEM, [{ field: 'id', message: MENSAGEM }]));
};
