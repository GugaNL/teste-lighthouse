const { validationError } = require('../serialize/handlingErrorsValidation');
const { serializeErrors } = require('../serialize/errorSerialize');

const validate =
  (schema, origem = 'body') =>
  (req, res, next) => {
    const entrada = req[origem] ?? {};
    const { error, value } = schema.validate(entrada, { abortEarly: false, stripUnknown: true });

    if (error) {
      const erro = validationError(error);
      return res.status(erro.statusCode).json(serializeErrors(erro));
    }

    if (origem === 'query') {
      Object.defineProperty(req, 'query', { value, writable: true, configurable: true });
    } else {
      req[origem] = value;
    }
    return next();
  };

module.exports = { validate };
