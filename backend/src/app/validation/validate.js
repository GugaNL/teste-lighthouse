const { validationError } = require('../serialize/handlingErrorsValidation');
const { respondWithError } = require('../helpers/respondWithError');

const validate =
  (schema, origem = 'body') =>
  (req, res, next) => {
    const entrada = req[origem] ?? {};
    const { error, value } = schema.validate(entrada, { abortEarly: false, stripUnknown: true });

    if (error) return respondWithError(res, validationError(error));

    if (origem === 'body') req.body = value;
    else res.locals[origem] = value;
    return next();
  };

module.exports = { validate };
