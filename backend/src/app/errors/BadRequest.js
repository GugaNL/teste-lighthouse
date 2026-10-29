const HttpError = require('./HttpError');

class BadRequest extends HttpError {
  constructor(message = 'Requisição inválida.', details) {
    super(400, 'Bad Request', message, { details });
  }
}

module.exports = BadRequest;
