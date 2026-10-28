const { validationError } = require('../serialize/handlingErrorsValidation');
const { serializeErrors } = require('../serialize/errorSerialize');

/**
 * Middleware de validação a partir de um esquema Joi.
 *
 * Responde 400 com todos os campos inválidos de uma vez (abortEarly: false) —
 * o formulário mostra todos os erros juntos, em vez de um por tentativa.
 * Campos desconhecidos são descartados (stripUnknown): o frontend pode mandar
 * o objeto inteiro de volta, com id e datas, que só o permitido chega ao service.
 */
const validate =
  (schema, origem = 'body') =>
  (req, res, next) => {
    // Express 5 deixa req.body undefined quando não há corpo; tratar como objeto
    // vazio faz a resposta listar os campos obrigatórios, que é mais útil.
    const entrada = req[origem] ?? {};
    const { error, value } = schema.validate(entrada, { abortEarly: false, stripUnknown: true });

    if (error) {
      const erro = validationError(error);
      return res.status(erro.statusCode).json(serializeErrors(erro));
    }

    if (origem === 'query') {
      // No Express 5 req.query é um getter sem setter; sombrear a propriedade
      // na própria requisição entrega ao controller o valor já convertido.
      Object.defineProperty(req, 'query', { value, writable: true, configurable: true });
    } else {
      req[origem] = value;
    }
    return next();
  };

module.exports = { validate };
